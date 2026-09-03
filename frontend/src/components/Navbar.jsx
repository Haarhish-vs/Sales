import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-logo gradient-text">Nexus</Link>
                <ul className="navbar-nav">
                    <li><NavLink to="/" end>Home</NavLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                    <li><NavLink to="/products">Products</NavLink></li>
                    <li><NavLink to="/contact">Contact</NavLink></li>
                </ul>
                <div className="navbar-actions">
                    {user ? (
                        <>
                            <Link to="/profile" className="btn btn-secondary btn-sm">👤 {user.name?.split(' ')[0]}</Link>
                            <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                        </>
                    )}
                </div>
                <button className="navbar-menu-btn" onClick={() => setOpen(!open)}>☰</button>
            </div>
            <div className={`navbar-mobile-nav ${open ? 'open' : ''}`}>
                <NavLink to="/" end onClick={() => setOpen(false)}>Home</NavLink>
                <NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink>
                <NavLink to="/products" onClick={() => setOpen(false)}>Products</NavLink>
                <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
                {user ? (
                    <>
                        <NavLink to="/profile" onClick={() => setOpen(false)}>Profile</NavLink>
                        <a href="#" onClick={handleLogout} style={{ color: '#ef4444' }}>Logout</a>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" onClick={() => setOpen(false)}>Login</NavLink>
                        <NavLink to="/register" onClick={() => setOpen(false)}>Register</NavLink>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
