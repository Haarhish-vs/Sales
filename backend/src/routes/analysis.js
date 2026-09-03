import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Python Error:', errorData);
            return res.status(500).json({ error: 'Thermal analysis failed', details: errorData });
        }

        try {
            // Find the JSON string in the output (ignoring any other prints from modules)
            const jsonStr = outputData.split('\n').filter(l => l.startsWith('{')).pop();
            const result = JSON.parse(jsonStr);

            // Re-map internal paths to express accessible URLs (we need to serve the output dir) 
            const pdfName = path.basename(result.pdf_report);
            const imgName = path.basename(result.annotated_image);

            res.json({
                message: 'Analysis complete',
                anomalies_count: result.anomalies_count,
                pdf_url: `http://localhost:${process.env.PORT || 5000}/output/${pdfName}`,
                image_url: `http://localhost:${process.env.PORT || 5000}/output/${imgName}`
            });
        } catch (err) {
            console.error('Failed to parse Python output:', outputData);
            res.status(500).json({ error: 'Invalid response from analysis engine' });
        }
    });
});

export default router;
