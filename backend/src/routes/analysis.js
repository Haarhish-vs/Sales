import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadsDir = path.join(__dirname, '../../uploads');
const outputDir = path.join(__dirname, '../../output');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 1. Chunk Receiver Endpoint
router.post('/upload-chunk', upload.single('chunk'), (req, res) => {
    try {
        const { fileId, originalName, chunkIndex, totalChunks } = req.body;
        if (!req.file) return res.status(400).json({ error: 'Chunk missing' });

        const ext = path.extname(originalName || '.tiff');
        const finalFilename = `${fileId}${ext}`;
        const filePath = path.join(uploadsDir, finalFilename);

        // Append chunk to the growing generic file
        fs.appendFileSync(filePath, req.file.buffer);

        res.json({ message: `Chunk ${chunkIndex} received`, path: finalFilename });
    } catch (err) {
        console.error('Chunk upload error', err);
        res.status(500).json({ error: 'Failed to stitch upload chunks' });
    }
});

// 2. Process Assembled Local File Endpoint
router.post('/process-local', async (req, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename missing' });

    const localImagePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(localImagePath)) {
        return res.status(404).json({ error: 'Assembled file missing on server' });
    }

    let targetProcessPath = localImagePath;

    try {
        // UNCONDITIONAL NORMALIZATION: All uploaded images must be clamped to safe dimensions.
        // A heavily compressed 7MB .tiff with a 20k x 20k resolution will decompress into 1.2GB of RAW RAM inside OpenCV.
        // By using libvips (sharp) to stream-resize it safely to a maximum 3Kx3K matrix (27MB RAM), we guarantee OpenCV won't trigger OS OOM Killers.
        const ext = path.extname(filename);
        const normalizedFilename = `clamped_${Date.now()}.jpg`;
        const normalizedPath = path.join(uploadsDir, normalizedFilename);

        await sharp(localImagePath, { limitInputPixels: false })
            .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(normalizedPath);

        console.log(`Matrix normalized successfully for OpenCV safety. Destroying raw chunk file.`);
        try { fs.unlinkSync(localImagePath); } catch (e) { }

        targetProcessPath = normalizedPath;
    } catch (compressErr) {
        console.error("Auto-compression skipped or failed:", compressErr);
        // Fallback: If compression fails, attempt raw Python execution
    }

    const pythonScript = path.join(__dirname, '../../../python-engine/analyze.py');

    // Spawn Python Process natively on the Render server over the safe file
    const pythonProcess = spawn('python', [pythonScript, targetProcessPath, outputDir]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => outputData += data.toString());
    pythonProcess.stderr.on('data', (data) => errorData += data.toString());

    pythonProcess.on('close', async (code, signal) => {
        console.log(`[SYS] Python process terminated. Exit Code: ${code} | OS Signal: ${signal}`);
        console.log(`[SYS] Python STDOUT Log length: ${outputData.length} chars`);
        if (errorData) {
            console.log(`[SYS] Python STDERR (Warnings/Errors):`, errorData);
        }

        if (code !== 0 || signal) {
            console.error(`[FATAL] Analysis failed! Code: ${code}, Signal: ${signal}`);
            if (signal === 'SIGKILL' || code === 137) {
                console.error(`[CRITICAL] Your Render Server ran out of RAM! PyTorch needs >1GB to load. Free tier is 512MB limit!`);
            }
            try { fs.unlinkSync(targetProcessPath); } catch (e) { }
            return res.status(500).json({ error: 'Thermal analysis Engine Crashed', details: errorData, signal: signal });
        }

        try {
            const jsonStr = outputData.split('\n').filter(l => l.startsWith('{')).pop();
            const result = JSON.parse(jsonStr);

            const csvPath = result.csv_report;
            const imgPath = path.join(outputDir, "annotated_overview.jpg");
            const csvName = path.basename(csvPath);
            const imgName = path.basename(imgPath);
            const originalName = path.basename(localImagePath);

            const imgBuffer = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;
            const csvBuffer = fs.existsSync(csvPath) ? fs.readFileSync(csvPath) : null;

            const uploadFile = async (name, buffer, mimeType) => {
                if (!buffer) return null;
                const { data, error } = await supabase.storage.from('reports').upload(name, buffer, { contentType: mimeType, upsert: true });
                if (error) throw error;
                return supabase.storage.from('reports').getPublicUrl(name).data.publicUrl;
            };

            const annotatedUrl = await uploadFile(`annotated_${imgName}`, imgBuffer, 'image/jpeg');
            const csvUrl = await uploadFile(csvName, csvBuffer, 'text/csv');

            const { data: dbRecord, error: dbError } = await supabase.from('analysis_reports').insert([{
                anomalies_count: result.total_panels,
                original_image_url: 'local_disposable_file',
                annotated_image_url: annotatedUrl,
                pdf_report_url: csvUrl, // repurposing field for CSV URL temporarily
            }]).select().single();

            if (dbError) throw dbError;

            // Obliterate all ephemeral massive traces from Render disk
            setTimeout(() => {
                try { fs.unlinkSync(localImagePath); } catch (e) { }
                try { fs.unlinkSync(imgPath); } catch (e) { }
                try { fs.unlinkSync(csvPath); } catch (e) { }
            }, 1000);

            let panelData = [];
            if (csvBuffer) {
                const csvString = csvBuffer.toString();
                const lines = csvString.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length > 1) {
                    const headers = lines[0].split(',');
                    panelData = lines.slice(1).map(line => {
                        const values = line.split(',');
                        let obj = {};
                        headers.forEach((h, i) => obj[h] = values[i]);
                        return obj;
                    });
                }
            }

            res.json({
                message: 'Analysis complete and synced to cloud',
                total_panels: result.total_panels,
                csv_url: csvUrl,
                image_url: annotatedUrl,
                report: dbRecord,
                models: result.models_used,
                panel_data: panelData
            });
        } catch (err) {
            console.error('Failed to process Cloud sync:', err);
            try { fs.unlinkSync(localImagePath); } catch (e) { }
            res.status(500).json({ error: 'Failed to process results' });
        }
    });
});

export default router;
