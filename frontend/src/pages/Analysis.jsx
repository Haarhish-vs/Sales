import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Automatically route API traffic to local node server if running locally via 'npm run dev'
const API_BASE = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    : 'https://sales-hkhf.onrender.com/api';

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

    // Process panel metrics if result exists
    const metrics = React.useMemo(() => {
        if (!result || !result.panel_data) return null;
        const total = result.panel_data.length || result.total_panels;
        let highConf = 0;
        let totalArea = 0;
        result.panel_data.forEach(p => {
            if (parseFloat(p.Confidence) > 0.8) highConf++;
            totalArea += parseFloat(p.Area_px || 0);
        });

        return {
            total,
            highConf,
            avgArea: total > 0 ? Math.round(totalArea / total) : 0
        };
    }, [result]);

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <span className="badge badge-primary" style={{ marginBottom: 16 }}>COMPUTER VISION AI</span>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: 12 }}>Thermal Panel <span className="gradient-text">Scan</span></h1>
                    <p style={{ maxWidth: 600, margin: '0 auto' }}>Upload your massive drone thermal orthomosaics securely. Our dual-chunk pipeline bypasses all upload limits automatically.</p>
                </div>
            </div>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container" style={{ maxWidth: result ? 1200 : 800 }}>

                    {!result ? (
                        <div className="card" style={{ padding: 40 }}>
                            {error && <div className="form-alert" style={{ marginBottom: 20 }}>{error}</div>}

                            {!user && (
                                <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, color: '#1e40af', marginBottom: 24, fontSize: '0.9rem' }}>
                                    <strong>Note:</strong> You can run scans as a guest, but please <a href="/login" style={{ textDecoration: 'underline' }}>log in</a> to save your report history.
                                </div>
                            )}

                            <form onSubmit={handleUpload} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 32 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Select High Res Map (Any Size)</label>
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
                        </div>
                    ) : (
                        <div className="dashboard-results">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <h2>Analysis <span className="gradient-text">Dashboard</span></h2>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <a href={result.image_url} target="_blank" download rel="noreferrer" className="btn btn-secondary">
                                        🖼️ Download Annotated Map
                                    </a>
                                    <a href={result.csv_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                                        📥 Download YOLO CSV
                                    </a>
                                </div>
                            </div>

                            {/* KPIs */}
                            <div className="kpi-grid">
                                <div className="kpi-card">
                                    <span className="kpi-label">Total Panels Detected</span>
                                    <span className="kpi-value">{metrics?.total || 0}</span>
                                </div>
                                <div className="kpi-card">
                                    <span className="kpi-label">High Confidence (&gt;80%)</span>
                                    <span className="kpi-value">{metrics?.highConf || 0}</span>
                                </div>
                                <div className="kpi-card">
                                    <span className="kpi-label">Avg Panel Footprint (px)</span>
                                    <span className="kpi-value">{metrics?.avgArea || 0}</span>
                                </div>
                                <div className="kpi-card">
                                    <span className="kpi-label">Model Weights Used</span>
                                    <span className="kpi-value" style={{ fontSize: '1.4rem', color: '#16a34a' }}>{result.models || 'yolov8n-seg.pt'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

                                <div className="card" style={{ padding: 24 }}>
                                    <h3 style={{ marginBottom: 20 }}>Panel Structure Register</h3>

                                    {result.panel_data && result.panel_data.length > 0 ? (
                                        <div className="data-table-container">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Panel ID</th>
                                                        <th>Confidence</th>
                                                        <th>BBox Area (px)</th>
                                                        <th>Center (X, Y)</th>
                                                        <th>GeoCoordinates</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.panel_data.slice(0, 100).map((panel, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{panel.Panel_ID}</td>
                                                            <td>
                                                                <span className={`badge ${parseFloat(panel.Confidence) > 0.8 ? 'badge-success' : 'badge-warning'}`}>
                                                                    {Math.round(parseFloat(panel.Confidence) * 100)}%
                                                                </span>
                                                            </td>
                                                            <td>{panel.Area_px}</td>
                                                            <td style={{ fontFamily: 'monospace' }}>{panel.Center_X}, {panel.Center_Y}</td>
                                                            <td style={{ color: 'var(--color-text-muted)' }}>
                                                                {panel.Latitude && panel.Longitude ? `${parseFloat(panel.Latitude).toFixed(5)}, ${parseFloat(panel.Longitude).toFixed(5)}` : 'No CRS Found'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {result.panel_data.length > 100 && (
                                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', borderTop: '1px solid var(--color-border)' }}>
                                                    Showing first 100 rows. Download the CSV for the full register.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
                                            <h4 style={{ color: '#991b1b', marginBottom: 8 }}>Zero Panels Detected</h4>
                                            <p style={{ color: '#b91c1c', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto' }}>
                                                The analyzer returned an empty payload. If you are predicting on a thermal array using the default `yolov8n-seg.pt` fallback model (trained for dogs and cars), it will naturally find 0 panels. <strong>Supply your custom solar weights!</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </section>
        </div>
    );
};

export default Analysis;
