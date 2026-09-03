import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
const outputDir = path.join(__dirname, '../../output');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 1. Generate a signed URL for the frontend to upload massive files securely without proxy limits
router.get('/upload-url', async (req, res) => {
    try {
        const ext = path.extname(req.query.filename || '.tiff');
        const fileName = `raw_${Date.now()}${ext}`;

        const { data, error } = await supabase.storage.from('reports').createSignedUploadUrl(fileName);

        if (error) throw error;
        res.json({ url: data.signedUrl, path: fileName });
    } catch (err) {
        console.error('Failed to generate upload URL', err);
        res.status(500).json({ error: 'Failed to generate secure upload url' });
    }
});

// 2. Process the file after the frontend has successfully uploaded it to Supabase
router.post('/process', async (req, res) => {
    const storagePath = req.body.path;
    if (!storagePath) return res.status(400).json({ error: 'No storage path provided' });

    const localImagePath = path.join(uploadsDir, storagePath);

    try {
        // Download the raw image from Supabase to the local disk for OpenCV processing
        const { data: fileData, error: downloadError } = await supabase.storage.from('reports').download(storagePath);
        if (downloadError) throw downloadError;

        const buffer = Buffer.from(await fileData.arrayBuffer());
        fs.writeFileSync(localImagePath, buffer);

    } catch (err) {
        console.error('Failed to download image from cloud:', err);
        return res.status(500).json({ error: 'Failed to retrieve uploaded image from cloud storage' });
    }

    const pythonScript = path.join(__dirname, '../../../python-engine/analyze.py');

    // Spawn Python Process
    const pythonProcess = spawn('python', [pythonScript, localImagePath, outputDir]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

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

            const originalBuffer = fs.readFileSync(localImagePath);
            const imgBuffer = fs.readFileSync(imgPath);
            const pdfBuffer = fs.readFileSync(pdfPath);

            const uploadFile = async (name, buffer, mimeType) => {
                const { data, error } = await supabase.storage.from('reports').upload(name, buffer, { contentType: mimeType, upsert: true });
                if (error) throw error;
                return supabase.storage.from('reports').getPublicUrl(name).data.publicUrl;
            };

            const originalUrl = await uploadFile(`original_${originalName}`, originalBuffer, 'image/tiff');
            const annotatedUrl = await uploadFile(`annotated_${imgName}`, imgBuffer, 'image/png');
            const pdfUrl = await uploadFile(pdfName, pdfBuffer, 'application/pdf');

            const { data: dbRecord, error: dbError } = await supabase.from('analysis_reports').insert([{
                anomalies_count: result.anomalies_count,
                original_image_url: originalUrl,
                annotated_image_url: annotatedUrl,
                pdf_report_url: pdfUrl,
            }]).select().single();

            if (dbError) throw dbError;

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
            console.error('Failed to process and sync Python output:', err);
            try { fs.unlinkSync(localImagePath); } catch (e) { }
            res.status(500).json({ error: 'Failed to process and sync results to cloud' });
        }
    });

    // Remove the raw upload file from the bucket (since we re-uploaded it as 'original_xyz') to keep storage clean
    supabase.storage.from('reports').remove([storagePath]).catch(e => console.error('Failed to cleanup raw upload', e));
});

export default router;
