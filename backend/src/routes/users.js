import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, bio, avatar_url, created_at')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json({ user });
    } catch (err) { next(err); }
});

// UPDATE profile
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const { name, bio, avatar_url } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .update({ name, bio, avatar_url, updated_at: new Date() })
            .eq('id', req.user.id)
            .select('id, name, email, role, bio, avatar_url, created_at')
            .single();
        if (error) throw error;
        res.json({ user });
    } catch (err) { next(err); }
});

// GET all users (admin only)
router.get('/', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ users });
    } catch (err) { next(err); }
});

export default router;
