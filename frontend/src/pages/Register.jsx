import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Minimum 6 characters';
        if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
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
        setError('');
        try {
            await register(form.name, form.email, form.password);
            navigate('/profile');
        } catch (err) { setError(err.message); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <span className="badge badge-primary" style={{ marginBottom: 16 }}>GET STARTED</span>
                <h2>Create Account</h2>
                <p>Join us and unlock all features</p>
                {error && <div className="form-alert" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="John Doe" />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="you@email.com" />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" />
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input name="confirm" type="password" className="form-input" value={form.confirm} onChange={handleChange} placeholder="Repeat password" />
                        {errors.confirm && <span className="form-error">{errors.confirm}</span>}
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
                </form>
                <p className="auth-divider" style={{ marginTop: 20 }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
