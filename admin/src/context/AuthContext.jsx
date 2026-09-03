import React, { createContext, useContext, useState, useCallback } from 'react';
import { adminLogin } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(() => {
        try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const data = await adminLogin({ email, password });
            if (data.user.role !== 'admin') throw new Error('You do not have admin access');
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));
            setAdmin(data.user);
            return data;
        } finally { setLoading(false); }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
    }, []);

    return (
        <AuthContext.Provider value={{ admin, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
