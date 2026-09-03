import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST contact form submission
router.post('/', async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: 'name, email, and message are required' });

        const { data, error } = await supabase
            .from('contact_messages')
            .insert([{ name, email, subject: subject || '', message }])
            .select('*').single();
        if (error) throw error;
        res.status(201).json({ message: 'Message sent successfully', data });
    } catch (err) { next(err); }
});

// GET all contact messages (admin)
router.get('/', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ messages: data });
    } catch (err) { next(err); }
});

export default router;
