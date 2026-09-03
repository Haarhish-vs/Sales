import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';

const features = [
    { icon: '🚀', title: 'Lightning Fast', desc: 'Optimized for speed and performance with modern architecture.', color: '#6c63ff' },
    { icon: '🔐', title: 'Secure by Default', desc: 'JWT-based authentication with bcrypt password hashing.', color: '#ff6b9d' },
    { icon: '📦', title: 'Product Management', desc: 'Full CRUD operations for products with real-time data.', color: '#22c55e' },
    { icon: '📱', title: 'Fully Responsive', desc: 'Works seamlessly across all devices and screen sizes.', color: '#f59e0b' },
    { icon: '⚡', title: 'Real-time Data', desc: 'Dynamic content fetched directly from Supabase database.', color: '#06b6d4' },
    { icon: '🎨', title: 'Modern Design', desc: 'Premium dark UI with smooth animations and transitions.', color: '#a855f7' },
];

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const fetchFeatured = useCallback(async () => {
        try {
            const data = await api.getProducts();
            setFeaturedProducts((data.products || []).slice(0, 3));
        } catch { /* silently fail */ }
        finally { setLoadingProducts(false); }
    }, []);

    useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

    return (
        <div className="page">

            {/* Hero */}
            <section className="hero section">
                <div className="container hero-content fade-up">
                    <div className="hero-badge">
                        <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                        Live &amp; Connected to Supabase
                    </div>
                    <h1 className="display" style={{ marginBottom: 20, color: '#0f172a' }}>
                        The Platform That<br />
                        <span className="gradient-text">Powers Growth</span>
                    </h1>
                    <p className="lead">
                        A full-stack web application with React, Node.js and Supabase. Dynamic data, real authentication, and seamless ordering — all working live.
                    </p>
                    <div className="hero-actions">
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                        <Link to="/register" className="btn btn-secondary">Get Started Free</Link>
                    </div>
                </div>
            </section>

            <div className="glow-divider"></div>

            {/* Stats */}
            <section className="section-sm">
                <div className="container">
                    <div className="stats-strip">
                        <div className="stat-item"><div className="stat-value gradient-text">100%</div><div className="stat-label">Dynamic Data</div></div>
                        <div className="stat-item"><div className="stat-value gradient-text">JWT</div><div className="stat-label">Auth Security</div></div>
                        <div className="stat-item"><div className="stat-value gradient-text">REST</div><div className="stat-label">API Architecture</div></div>
                        <div className="stat-item"><div className="stat-value gradient-text">CRUD</div><div className="stat-label">Full Operations</div></div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section">
                <div className="container">
                    <p className="badge badge-primary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>FEATURES</p>
                    <h2 className="section-title" style={{ marginBottom: 16 }}>Everything You Need</h2>
                    <p className="lead" style={{ marginBottom: 52 }}>A production-ready stack with real backend logic, database operations, and dynamic content.</p>
                    <div className="features-grid">
                        {features.map(f => (
                            <div key={f.title} className="card">
                                <div className="feature-icon" style={{ background: `${f.color}20` }}>
                                    <span>{f.icon}</span>
                                </div>
                                <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>{f.title}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="section section-alt">
                <div className="container">
                    <p className="badge badge-primary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>PRODUCTS</p>
                    <h2 className="section-title" style={{ marginBottom: 16 }}>Featured Products</h2>
                    <p className="lead" style={{ marginBottom: 48 }}>Live data from your Supabase database. Add products to see them here.</p>
                    {loadingProducts ? (
                        <div className="loading-state"><div className="spinner"></div><p>Loading products...</p></div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <p>No products yet. <Link to="/products" style={{ color: 'var(--color-primary)' }}>Add some products</Link> to get started.</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {featuredProducts.map(p => (
                                <div key={p.id} className="card product-card">
                                    {p.image_url && <img src={p.image_url} alt={p.name} className="card-img" />}
                                    <span className="product-card-category">{p.category}</span>
                                    <div className="product-card-name">{p.name}</div>
                                    <div className="product-card-price">${parseFloat(p.price).toFixed(2)}</div>
                                    <div className="product-card-actions">
                                        <Link to="/products" className="btn btn-secondary btn-sm">View All</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <Link to="/products" className="btn btn-primary">View All Products →</Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="section-title" style={{ marginBottom: 16 }}>Ready to Get Started?</h2>
                    <p className="lead" style={{ marginBottom: 36 }}>Create your account and start exploring all features today.</p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary">Create Free Account</Link>
                        <Link to="/contact" className="btn btn-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
