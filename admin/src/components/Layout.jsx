import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '🛰️', label: 'CV Analysis', path: '/analysis' },
    { icon: '👥', label: 'Users', path: '/users' },
    { icon: '📦', label: 'Products', path: '/products' },
    { icon: '🛒', label: 'Orders', path: '/orders' },
    { icon: '✉️', label: 'Messages', path: '/messages' },
    { icon: '⚙️', label: 'Site Settings', path: '/settings' },
];

const Layout = ({ children, title }) => {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h1>Nexus Admin</h1>
                    <span>Control Panel</span>
                </div>
                <nav className="sidebar-nav">
                    <span className="nav-section-label">Main Menu</span>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="admin-badge">
                        <div className="admin-avatar">{admin?.name?.[0]?.toUpperCase() || 'A'}</div>
                        <div className="admin-info">
                            <p>{admin?.name || 'Admin'}</p>
                            <span>Administrator</span>
                        </div>
                    </div>
                    <button className="logout-btn" style={{ width: '100%', marginTop: 10 }} onClick={handleLogout}>
                        🔓 Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">{title}</span>
                    <div className="topbar-right">
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Welcome, {admin?.name?.split(' ')[0]}</span>
                    </div>
                </header>
                <main className="content-area">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
