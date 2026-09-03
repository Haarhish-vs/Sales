import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sales-hkhf.onrender.com/api';

const Analysis = () => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError('');
        setProgress(0);

        try {
            const token = localStorage.getItem('token');
            const headers = {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB size safely glides past ANY cloud payload filters (Render, Cloudflare, etc)
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const fileId = `upload_${Date.now()}`;
            const originalName = file.name;
            const ext = originalName.split('.').pop();
            const finalFilename = `${fileId}.${ext}`;

            // 1. Slice and transmit chunks dynamically
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('chunk', chunk, 'chunk');
                formData.append('fileId', fileId);
                formData.append('chunkIndex', i);
                formData.append('totalChunks', totalChunks);
                formData.append('originalName', originalName);

                const chunkRes = await fetch(`${API_BASE}/analysis/upload-chunk`, {
                    method: 'POST',
                    headers,
                    body: formData
                });
                if (!chunkRes.ok) throw new Error(`Network disconnected uploading sequence ${i + 1}/${totalChunks}`);

                setProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            // 2. Trigger Assembly and Processing
            setProgress(100); // Upload done, processing starts

            const procRes = await fetch(`${API_BASE}/analysis/process-local`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: finalFilename })
            });

            const resultData = await procRes.json();
            if (!procRes.ok) throw new Error(resultData.error || 'Data process failed on the engine');

            setResult(resultData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <span className="badge badge-primary" style={{ marginBottom: 16 }}>COMPUTER VISION AI</span>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: 12 }}>Thermal Panel <span className="gradient-text">Scan</span></h1>
                    <p style={{ maxWidth: 600, margin: '0 auto' }}>Upload your massive drone thermal orthomosaics securely. Our dual-chunk pipeline bypasses all upload limits automatically.</p>
                </div>
            </div>

            <section className="section">
                <div className="container" style={{ maxWidth: 800 }}>
                    <div className="card" style={{ padding: 40 }}>
                        {error && <div className="form-alert" style={{ marginBottom: 20 }}>{error}</div>}

                        {!user && (
                            <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, color: '#1e40af', marginBottom: 24, fontSize: '0.9rem' }}>
                                <strong>Note:</strong> You can run scans as a guest, but please <a href="/login" style={{ textDecoration: 'underline' }}>log in</a> to save your report history.
                            </div>
                        )}

                        <form onSubmit={handleUpload} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 32 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text)' }}>Select High Res Map (Any Size)</label>
                                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 12, padding: 20, textAlign: 'center', background: 'var(--color-surface-hover)' }}>
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%' }} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '16px 24px' }} disabled={!file || loading}>
                                {loading && progress < 100 ? `Transmitting ${progress}%` : loading && progress === 100 ? 'Scanning...' : 'Start Scan 🚀'}
                            </button>
                        </form>

                        {loading && (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                                <h4 style={{ marginBottom: 8 }}>
                                    {progress < 100 ? `Streaming massive file to AI Engine... (${progress}%)` : `Analyzing Array Integrity...`}
                                </h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {progress < 100 ? `Bypassing proxy load balancers seamlessly.` : `Segmenting panels, rendering heatmaps, computing differentials...`}
                                </p>
                            </div>
                        )}

                        {result && (
                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 32, border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 20 }}>
                                    <h4 style={{ fontSize: '1.3rem' }}>Analysis Results</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <a href={result.image_url} target="_blank" download rel="noreferrer" className="btn" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                                            🖼️ Download Map
                                        </a>
                                        <a href={result.pdf_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                                            📥 Download PDF Report
                                        </a>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Detected Anomalies</div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
                                            {result.anomalies_count}
                                        </div>
                                        <p style={{ color: 'var(--color-text-muted)', marginTop: 12, fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            High-temperature differentials detected. Review the PDF report for exact coordinates and maintenance instructions.
                                        </p>
                                    </div>
                                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                                        <div style={{ width: '100%', height: 260, background: '#1e293b', position: 'relative' }}>
                                            <img src={result.image_url} alt="Heatmap Output" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4 }}>
                                                Rendered Heatmap Preview
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Analysis;
