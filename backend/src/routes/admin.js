import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

// Dashboard stats
router.get('/stats', authenticate, adminOnly, async (req, res, next) => {
    try {
        const [users, products, orders, messages] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id, total_price, status', { count: 'exact' }),
            supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        ]);
        const totalRevenue = (orders.data || []).reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        const pendingOrders = (orders.data || []).filter(o => o.status === 'pending').length;
        res.json({
            stats: {
                totalUsers: users.count || 0,
                totalProducts: products.count || 0,
                totalOrders: orders.count || 0,
                totalMessages: messages.count || 0,
                totalRevenue,
                pendingOrders,
            }
        });
    } catch (err) { next(err); }
});

// Get all users
router.get('/users', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { data: users, error } = await supabase
            .from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ users });
    } catch (err) { next(err); }
});

// Update user role
router.put('/users/:id/role', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { role } = req.body;
        const { data, error } = await supabase.from('users').update({ role }).eq('id', req.params.id).select('id,name,email,role').single();
        if (error) throw error;
        res.json({ user: data });
    } catch (err) { next(err); }
});

// Delete user
router.delete('/users/:id', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'User deleted' });
    } catch (err) { next(err); }
});

// Get all orders with user & product info
router.get('/orders', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, products(name, price), users(name, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ orders });
    } catch (err) { next(err); }
});

// Update order status
router.put('/orders/:id/status', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', req.params.id).select('*').single();
        if (error) throw error;
        res.json({ order: data });
    } catch (err) { next(err); }
});

// Get all contact messages
router.get('/messages', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ messages: data });
    } catch (err) { next(err); }
});

// Delete contact message
router.delete('/messages/:id', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Message deleted' });
    } catch (err) { next(err); }
});

// Site settings
router.get('/settings', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ settings: data || {} });
    } catch (err) { next(err); }
});

router.put('/settings', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { phone, email, address, hours, map_url } = req.body;
        // Upsert: insert if no row exists, otherwise update
        const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single();
        let result;
        if (existing) {
            result = await supabase.from('site_settings').update({ phone, email, address, hours, map_url, updated_at: new Date() }).eq('id', existing.id).select('*').single();
        } else {
            result = await supabase.from('site_settings').insert([{ phone, email, address, hours, map_url }]).select('*').single();
        }
        if (result.error) throw result.error;
        res.json({ settings: result.data });
    } catch (err) { next(err); }
});

export default router;
