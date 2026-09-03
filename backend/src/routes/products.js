import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all products
router.get('/', async (req, res, next) => {
    try {
        const { category, search } = req.query;
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });
        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('name', `%${search}%`);
        const { data: products, error } = await query;
        if (error) throw error;
        res.json({ products });
    } catch (err) { next(err); }
});

// GET single product
router.get('/:id', async (req, res, next) => {
    try {
        const { data: product, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) { next(err); }
});

// CREATE product (admin)
router.post('/', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category, image_url, stock } = req.body;
        const { data: product, error } = await supabase
            .from('products')
            .insert([{ name, description, price, category, image_url, stock: stock || 0 }])
            .select('*').single();
        if (error) throw error;
        res.status(201).json({ product });
    } catch (err) { next(err); }
});

// UPDATE product (admin)
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category, image_url, stock } = req.body;
        const { data: product, error } = await supabase
            .from('products')
            .update({ name, description, price, category, image_url, stock, updated_at: new Date() })
            .eq('id', req.params.id)
            .select('*').single();
        if (error) throw error;
        res.json({ product });
    } catch (err) { next(err); }
});

// DELETE product (admin)
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { error } = await supabase.from('products').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Product deleted successfully' });
    } catch (err) { next(err); }
});

export default router;
