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

// Define upload directories
const uploadsDir = path.join(__dirname, '../../uploads');
const outputDir = path.join(__dirname, '../../output');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `thermal_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imagePath = req.file.path;
    const pythonScript = path.join(__dirname, '../../../python-engine/analyze.py');

    // Spawn Python Process
    const pythonProcess = spawn('python', [pythonScript, imagePath, outputDir]);

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
            return res.status(500).json({ error: 'Thermal analysis failed', details: errorData });
        }

        try {
            // Find the JSON string in the output (ignoring any other prints from modules)
            const jsonStr = outputData.split('\n').filter(l => l.startsWith('{')).pop();
            const result = JSON.parse(jsonStr);

            const pdfPath = result.pdf_report;
            const imgPath = result.annotated_image;
            const pdfName = path.basename(pdfPath);
            const imgName = path.basename(imgPath);
            const originalName = path.basename(imagePath);

            // 1. Read files into memory
            const originalBuffer = fs.readFileSync(imagePath);
            const imgBuffer = fs.readFileSync(imgPath);
            const pdfBuffer = fs.readFileSync(pdfPath);

            // 2. Upload to Supabase Storage (Assumes 'reports' bucket exists and is public)
            const uploadFile = async (name, buffer, mimeType) => {
                const { data, error } = await supabase.storage.from('reports').upload(name, buffer, { contentType: mimeType, upsert: true });
                if (error) throw error;
                return supabase.storage.from('reports').getPublicUrl(name).data.publicUrl;
            };

            const originalUrl = await uploadFile(`original_${originalName}`, originalBuffer, 'image/tiff');
            const annotatedUrl = await uploadFile(`annotated_${imgName}`, imgBuffer, 'image/png');
            const pdfUrl = await uploadFile(pdfName, pdfBuffer, 'application/pdf');

            // 3. Save to database
            const { data: dbRecord, error: dbError } = await supabase.from('analysis_reports').insert([{
                anomalies_count: result.anomalies_count,
                original_image_url: originalUrl,
                annotated_image_url: annotatedUrl,
                pdf_report_url: pdfUrl,
            }]).select().single();

            if (dbError) throw dbError;

            // 4. Delete local files to free up disk space
            setTimeout(() => {
                try { fs.unlinkSync(imagePath); } catch (e) { }
                try { fs.unlinkSync(imgPath); } catch (e) { }
                try { fs.unlinkSync(pdfPath); } catch (e) { }
            }, 1000); // Small delay to ensure DB handles transaction completely

            res.json({
                message: 'Analysis complete and synced to cloud',
                anomalies_count: result.anomalies_count,
                pdf_url: pdfUrl,
                image_url: annotatedUrl,
                report: dbRecord
            });
        } catch (err) {
            console.error('Failed to process and sync Python output:', err);
            // Attempt cleanup on failure
            try { fs.unlinkSync(imagePath); } catch (e) { }
            res.status(500).json({ error: 'Failed to process and sync results to cloud' });
        }
    });
});

export default router;
