import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages - placeholder for now
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Analysis from './pages/Analysis';

const ProtectedRoute = ({ children }) => {
    const { admin } = useAuth();
    if (!admin) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout title="Dashboard"><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Layout title="Users"><Users /></Layout></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Layout title="Products"><Products /></Layout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Layout title="Orders"><Orders /></Layout></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Layout title="Messages"><Messages /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout title="Site Settings"><Settings /></Layout></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Layout title="Thermal Analysis"><Analysis /></Layout></ProtectedRoute>} />
        </Routes>
    );
}

export default App;
