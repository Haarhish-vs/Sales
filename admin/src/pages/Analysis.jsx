import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Analysis = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_BASE}/analysis/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to analyze image');
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="table-card">
            <div className="table-header">
                <h3>AI Thermal Image Analysis</h3>
                <span className="badge badge-purple">Computer Vision</span>
            </div>

            <div style={{ padding: 28 }}>
                <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
                    Upload a thermal drone orthomosaic (`.tiff`, `.png`, or `.jpg`). Our Computer Vision engine will segment the solar panel tables, map hotspots, and generate a structural PDF report instantly.
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleUpload} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 32 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Thermal Image File</label>
                        <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} style={{ padding: '8px 12px' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!file || loading}>
                        {loading ? 'Processing... (Mins)' : 'Upload & Analyze 🚀'}
                    </button>
                </form>

                {loading && (
                    <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 12 }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <h4>Analyzing Thermal Arrays...</h4>
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Splitting tables, detecting temperature differentials, generating PDF...</p>
                    </div>
                )}

                {result && (
                    <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h4 style={{ fontSize: '1.2rem' }}>Analysis Output</h4>
                            <a href={result.pdf_url} target="_blank" rel="noreferrer" className="btn btn-success">
                                ⬇️ Download PDF Report
                            </a>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 24 }}>
                            <div>
                                <h5 style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 8 }}>Detected Anomalies</h5>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--error)', lineHeight: 1 }}>
                                    {result.anomalies_count}
                                </div>
                                <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: '0.9rem' }}>High thermal differentials detected requiring maintenance review.</p>
                            </div>
                            <div>
                                <h5 style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 8 }}>Annotated Map</h5>
                                <div style={{ width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <img src={result.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analysis;
