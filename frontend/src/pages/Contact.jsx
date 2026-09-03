import React, { useState } from 'react';
import * as api from '../services/api';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [formError, setFormError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
        if (!form.message.trim()) e.message = 'Message is required';
        else if (form.message.length < 10) e.message = 'Message must be at least 10 characters';
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length) { setErrors(v); return; }
        setLoading(true); setFormError(''); setSuccess('');
        try {
            await api.sendContact(form);
            setSuccess('Message sent successfully! We will get back to you soon.');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err) { setFormError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="container">
                    <span className="badge badge-primary" style={{ marginBottom: 16 }}>CONTACT</span>
                    <h1>Get in <span className="gradient-text">Touch</span></h1>
                    <p>Have a question or want to work together? We'd love to hear from you.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Info */}
                        <div>
                            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Let's Talk</h2>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                                Fill out the form and our team will get back to you within 24 hours. We're here to help!
                            </p>
                            <div className="contact-info-items">
                                {[
                                    { icon: '📧', title: 'Email', info: 'hello@nexusapp.com' },
                                    { icon: '📞', title: 'Phone', info: '+1 (555) 123-4567' },
                                    { icon: '📍', title: 'Location', info: '123 Tech Street, San Francisco, CA 94105' },
                                    { icon: '🕐', title: 'Hours', info: 'Mon – Fri, 9am – 6pm PST' },
                                ].map(item => (
                                    <div key={item.title} className="contact-info-item">
                                        <div className="contact-info-icon">{item.icon}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>{item.info}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="card">
                            <h3 style={{ marginBottom: 24, fontSize: '1.2rem' }}>Send a Message</h3>
                            {success && <div className="form-success" style={{ marginBottom: 20 }}>{success}</div>}
                            {formError && <div className="form-alert" style={{ marginBottom: 20 }}>{formError}</div>}
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="Your name" />
                                        {errors.name && <span className="form-error">{errors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="you@email.com" />
                                        {errors.email && <span className="form-error">{errors.email}</span>}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input name="subject" className="form-input" value={form.subject} onChange={handleChange} placeholder="What's this about?" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea name="message" className="form-input" rows={5} value={form.message} onChange={handleChange} placeholder="Tell us more..." style={{ resize: 'vertical' }}></textarea>
                                    {errors.message && <span className="form-error">{errors.message}</span>}
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send Message 📨'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
