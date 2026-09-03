import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';

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

    const pythonScript = path.join(__dirname, '../../../python-engine/analyze.py');

    // Spawn Python Process natively on the Render server over the transient chunk-assembled file
    const pythonProcess = spawn('python', [pythonScript, localImagePath, outputDir]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => outputData += data.toString());
    pythonProcess.stderr.on('data', (data) => errorData += data.toString());

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error('Python Error:', errorData);
            try { fs.unlinkSync(localImagePath); } catch (e) { }
            return res.status(500).json({ error: 'Thermal analysis failed', details: errorData });
        }

        try {
            const jsonStr = outputData.split('\n').filter(l => l.startsWith('{')).pop();
            const result = JSON.parse(jsonStr);

            const pdfPath = result.pdf_report;
            const imgPath = result.annotated_image;
            const pdfName = path.basename(pdfPath);
            const imgName = path.basename(imgPath);
            const originalName = path.basename(localImagePath);

            // Read the generated analytical PDFs and PNGs (these are very small and fit well within Supabase 50MB free limits!)
            const imgBuffer = fs.readFileSync(imgPath);
            const pdfBuffer = fs.readFileSync(pdfPath);

            const uploadFile = async (name, buffer, mimeType) => {
                const { data, error } = await supabase.storage.from('reports').upload(name, buffer, { contentType: mimeType, upsert: true });
                if (error) throw error;
                return supabase.storage.from('reports').getPublicUrl(name).data.publicUrl;
            };

            // Notice we do NOT upload the 100MB original file to Supabase anymore to bypass their limit!
            const annotatedUrl = await uploadFile(`annotated_${imgName}`, imgBuffer, 'image/png');
            const pdfUrl = await uploadFile(pdfName, pdfBuffer, 'application/pdf');

            const { data: dbRecord, error: dbError } = await supabase.from('analysis_reports').insert([{
                anomalies_count: result.anomalies_count,
                original_image_url: 'local_disposable_file',
                annotated_image_url: annotatedUrl,
                pdf_report_url: pdfUrl,
            }]).select().single();

            if (dbError) throw dbError;

            // Obliterate all ephemeral massive traces from Render disk
            setTimeout(() => {
                try { fs.unlinkSync(localImagePath); } catch (e) { }
                try { fs.unlinkSync(imgPath); } catch (e) { }
                try { fs.unlinkSync(pdfPath); } catch (e) { }
            }, 1000);

            res.json({
                message: 'Analysis complete and synced to cloud',
                anomalies_count: result.anomalies_count,
                pdf_url: pdfUrl,
                image_url: annotatedUrl,
                report: dbRecord
            });
        } catch (err) {
            console.error('Failed to process Cloud sync:', err);
            try { fs.unlinkSync(localImagePath); } catch (e) { }
            res.status(500).json({ error: 'Failed to process results' });
        }
    });
});

export default router;
