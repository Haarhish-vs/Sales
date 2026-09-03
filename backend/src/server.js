import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import contactRoutes from './routes/contact.js';
import adminRoutes from './routes/admin.js';
import analysisRoutes from './routes/analysis.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true, // Dynamically echo back the requesting origin to bypass all CORS blocks
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analysis', analysisRoutes);

// Serve Output Files
app.use('/output', express.static(path.join(__dirname, '../../output')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
