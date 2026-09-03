import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// CREATE order
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { product_id, quantity, shipping_address } = req.body;
        if (!product_id || !quantity) return res.status(400).json({ error: 'product_id and quantity required' });

        // Fetch product for price
        const { data: product, error: prodErr } = await supabase.from('products').select('*').eq('id', product_id).single();
        if (prodErr || !product) return res.status(404).json({ error: 'Product not found' });

        const total_price = parseFloat(product.price) * parseInt(quantity);
        const { data: order, error } = await supabase
            .from('orders')
            .insert([{ user_id: req.user.id, product_id, quantity, total_price, shipping_address, status: 'pending' }])
            .select('*').single();
        if (error) throw error;
        res.status(201).json({ order });
    } catch (err) { next(err); }
});

// GET my orders
router.get('/my', authenticate, async (req, res, next) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, products(name, image_url, price)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ orders });
    } catch (err) { next(err); }
});

// GET all orders (admin)
router.get('/', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, products(name), users(name, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ orders });
    } catch (err) { next(err); }
});

// UPDATE order status (admin)
router.put('/:id/status', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { status } = req.body;
        const { data: order, error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date() })
            .eq('id', req.params.id)
            .select('*').single();
        if (error) throw error;
        res.json({ order });
    } catch (err) { next(err); }
});

export default router;
