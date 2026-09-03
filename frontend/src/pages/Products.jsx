import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

const Products = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [orderModal, setOrderModal] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState('');
    const [orderError, setOrderError] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (category !== 'All') params.category = category;
            if (search) params.search = search;
            const data = await api.getProducts(params);
            setProducts(data.products || []);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    }, [category, search]);

    useEffect(() => {
        const t = setTimeout(fetchProducts, 400);
        return () => clearTimeout(t);
    }, [fetchProducts]);

    const handleOrder = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        setOrderLoading(true); setOrderError(''); setOrderSuccess('');
        try {
            await api.createOrder({ product_id: orderModal.id, quantity: parseInt(quantity), shipping_address: address });
            setOrderSuccess('Order placed successfully!');
            setTimeout(() => { setOrderModal(null); setOrderSuccess(''); setQuantity(1); setAddress(''); }, 1800);
        } catch (err) { setOrderError(err.message); }
        finally { setOrderLoading(false); }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="container">
                    <span className="badge badge-primary" style={{ marginBottom: 16 }}>CATALOG</span>
                    <h1>Products &amp; <span className="gradient-text">Services</span></h1>
                    <p>Browse our live catalog, dynamically fetched from the database.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    {/* Filters */}
                    <div className="filters">
                        <div className="search-input-wrap">
                            <span className="search-icon">🔍</span>
                            <input className="form-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        {CATEGORIES.map(c => (
                            <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div><p>Loading products...</p></div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <h3>No products found</h3>
                            <p style={{ marginTop: 8 }}>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map(p => (
                                <div key={p.id} className="card product-card">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="card-img" />
                                    ) : (
                                        <div className="card-img" style={{ background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
                                    )}
                                    <span className="product-card-category">{p.category}</span>
                                    <div className="product-card-name">{p.name}</div>
                                    {p.description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: 6, lineHeight: 1.5 }}>{p.description.slice(0, 90)}{p.description.length > 90 ? '…' : ''}</p>}
                                    <div className="product-card-price">${parseFloat(p.price).toFixed(2)}</div>
                                    <div style={{ fontSize: '0.8rem', color: p.stock > 0 ? '#16a34a' : '#dc2626', marginBottom: 4 }}>
                                        {p.stock > 0 ? `✓ ${p.stock} in stock` : '✗ Out of stock'}
                                    </div>
                                    <div className="product-card-actions">
                                        <button className="btn btn-primary btn-sm" onClick={() => { setOrderModal(p); setOrderError(''); setOrderSuccess(''); }} disabled={!p.stock}>
                                            {p.stock > 0 ? 'Order Now' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Order Modal */}
            {orderModal && (
                <div className="modal-overlay" onClick={() => setOrderModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Place Order</h3>
                            <button className="modal-close" onClick={() => setOrderModal(null)}>✕</button>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
                            <strong style={{ color: 'var(--color-text)' }}>{orderModal.name}</strong> — ${parseFloat(orderModal.price).toFixed(2)} each
                        </p>
                        {orderSuccess && <div className="form-success" style={{ marginBottom: 16 }}>{orderSuccess}</div>}
                        {orderError && <div className="form-alert" style={{ marginBottom: 16 }}>{orderError}</div>}
                        <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input type="number" className="form-input" min="1" max={orderModal.stock} value={quantity} onChange={e => setQuantity(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Shipping Address</label>
                                <textarea className="form-input" rows={3} value={address} onChange={e => setAddress(e.target.value)} required placeholder="Enter your shipping address" style={{ resize: 'vertical' }}></textarea>
                            </div>
                            <div style={{ background: '#eff6ff', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                                <strong>Total: ${(parseFloat(orderModal.price) * parseInt(quantity || 1)).toFixed(2)}</strong>
                            </div>
                            {!user && <p style={{ color: 'var(--color-warning)', fontSize: '0.88rem' }}>Please login to place an order.</p>}
                            <button type="submit" className="btn btn-primary" disabled={orderLoading || !user}>{orderLoading ? 'Placing order…' : 'Confirm Order'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
