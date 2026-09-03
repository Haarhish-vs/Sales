import React, { useEffect, useState } from 'react';
import { getStats } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dummyData = [
    { name: 'Mon', revenue: 400 },
    { name: 'Tue', revenue: 300 },
    { name: 'Wed', revenue: 550 },
    { name: 'Thu', revenue: 450 },
    { name: 'Fri', revenue: 700 },
    { name: 'Sat', revenue: 650 },
    { name: 'Sun', revenue: 800 },
];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats()
            .then(res => setStats(res.stats))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div>
                            <div className="stat-value">${(stats?.totalRevenue || 0).toFixed(2)}</div>
                            <div className="stat-label">Total Revenue</div>
                        </div>
                        <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>💰</div>
                    </div>
                    <div className="stat-trend">↑ +12.5% from last week</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div>
                            <div className="stat-value">{stats?.totalOrders || 0}</div>
                            <div className="stat-label">Total Orders</div>
                        </div>
                        <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>🛒</div>
                    </div>
                    <div className="stat-trend" style={{ color: '#64748b' }}>{stats?.pendingOrders || 0} pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div>
                            <div className="stat-value">{stats?.totalProducts || 0}</div>
                            <div className="stat-label">Products</div>
                        </div>
                        <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>📦</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div>
                            <div className="stat-value">{stats?.totalUsers || 0}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>👥</div>
                    </div>
                </div>
            </div>

            <div className="table-card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 20 }}>Revenue Overview (Mock)</h3>
                <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dummyData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `$${v}`} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
