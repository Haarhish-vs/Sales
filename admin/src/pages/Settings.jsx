import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/api';

const Settings = () => {
    const [form, setForm] = useState({ phone: '', email: '', address: '', hours: '', map_url: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        getSettings()
            .then(res => { if (res.settings) setForm(res.settings); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        try {
            const res = await updateSettings(form);
            setForm(res.settings);
            setMsg('Settings saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            alert(err.message);
        } finally { setSaving(false); }
    };

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <div className="table-card" style={{ maxWidth: 700 }}>
            <div className="table-header">
                <h3>Site Configuration</h3>
            </div>
            <div style={{ padding: 28 }}>
                <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                    Update the contact information shown on your public website's Contact page.
                </p>

                {msg && <div className="alert alert-success">{msg}</div>}

                <form onSubmit={handleSave} className="form-grid">
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Contact Email</label>
                            <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="hello@nexus.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Office Address</label>
                        <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Innovation Drive..." />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Business Hours</label>
                        <input type="text" className="form-input" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="Mon - Fri, 9:00 AM - 6:00 PM" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Google Maps Embed URL (optional)</label>
                        <input type="url" className="form-input" value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} placeholder="https://www.google.com/maps/embed?..." />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 12 }} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
