import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.password) e.password = 'Password is required';
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
            await login(form.email, form.password);
            navigate('/profile');
        } catch (err) { setError(err.message); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <span className="badge badge-primary" style={{ marginBottom: 16 }}>WELCOME BACK</span>
                <h2>Sign In</h2>
                <p>Enter your credentials to access your account</p>
                {error && <div className="form-alert" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="you@email.com" />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} placeholder="Your password" />
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
                </form>
                <p className="auth-divider" style={{ marginTop: 20 }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
