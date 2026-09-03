import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '', avatar_url: '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [saveError, setSaveError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [profileData, ordersData] = await Promise.all([api.getProfile(), api.getMyOrders()]);
            setProfile(profileData.user);
            setForm({ name: profileData.user.name || '', bio: profileData.user.bio || '', avatar_url: profileData.user.avatar_url || '' });
            setOrders(ordersData.orders || []);
        } catch { navigate('/login'); }
        finally { setLoadingProfile(false); }
    }, [navigate]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchData();
    }, [user, navigate, fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setSaveMsg(''); setSaveError('');
        try {
            const data = await api.updateProfile(form);
            setProfile(data.user);
            setEditMode(false);
            setSaveMsg('Profile updated!');
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (err) { setSaveError(err.message); }
        finally { setSaving(false); }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const statusColor = { pending: '#d97706', processing: '#2563eb', shipped: '#0284c7', delivered: '#16a34a', cancelled: '#dc2626' };

    if (loadingProfile) return <div className="page"><div className="loading-state" style={{ minHeight: '60vh' }}><div className="spinner"></div><p>Loading profile…</p></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div className="container">
                    <span className="badge badge-primary" style={{ marginBottom: 16 }}>DASHBOARD</span>
                    <h1>My <span className="gradient-text">Profile</span></h1>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, alignItems: 'start' }}>

                        {/* Sidebar */}
                        <div className="card" style={{ position: 'sticky', top: 88 }}>
                            <div className="avatar" style={{ margin: '0 auto 20px' }}>
                                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" /> : profile?.name?.[0]?.toUpperCase()}
                            </div>
                            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', marginBottom: 4 }}>{profile?.name}</h2>
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 8 }}>{profile?.email}</p>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <span className={`badge badge-${profile?.role === 'admin' ? 'warning' : 'primary'}`}>{profile?.role}</span>
                            </div>
                            {profile?.bio && <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>{profile.bio}</p>}
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', textAlign: 'center', marginBottom: 20 }}>
                                Member since {new Date(profile?.created_at).toLocaleDateString()}
                            </p>
                            {saveMsg && <div className="form-success" style={{ marginBottom: 12, textAlign: 'center', fontSize: '0.85rem' }}>{saveMsg}</div>}
                            <button className="btn btn-secondary btn-full" style={{ marginBottom: 10 }} onClick={() => setEditMode(!editMode)}>{editMode ? 'Cancel' : '✏️ Edit Profile'}</button>
                            <button className="btn btn-full" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={handleLogout}>Logout</button>
                        </div>

                        {/* Main */}
                        <div>
                            {/* Edit form */}
                            {editMode && (
                                <div className="card" style={{ marginBottom: 24 }}>
                                    <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>
                                    {saveError && <div className="form-alert" style={{ marginBottom: 16 }}>{saveError}</div>}
                                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Bio</label>
                                            <textarea className="form-input" rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself…" style={{ resize: 'vertical' }}></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Avatar URL</label>
                                            <input className="form-input" value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
                                        </div>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                                    </form>
                                </div>
                            )}

                            {/* Orders */}
                            <div className="card">
                                <h3 style={{ marginBottom: 20 }}>My Orders</h3>
                                {orders.length === 0 ? (
                                    <div className="empty-state" style={{ paddingBlock: 32 }}>
                                        <div className="empty-state-icon">🛒</div>
                                        <p>No orders yet.</p>
                                        <Link to="/products" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Browse Products</Link>
                                    </div>
                                ) : (
                                    <div className="orders-list">
                                        {orders.map(o => (
                                            <div key={o.id} className="order-item">
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{o.products?.name || 'Product'}</div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        Qty: {o.quantity} · {new Date(o.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>${parseFloat(o.total_price).toFixed(2)}</div>
                                                    <span className="badge" style={{ background: `${statusColor[o.status] || '#2563eb'}18`, color: statusColor[o.status] || '#2563eb' }}>{o.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Profile;
