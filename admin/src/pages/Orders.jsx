import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../services/api';

const statusColor = { pending: 'yellow', processing: 'blue', shipped: 'cyan', delivered: 'green', cancelled: 'red' };

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = () => {
        getOrders()
            .then(res => setOrders(res.orders))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleStatus = async (id, status) => {
        try {
            await updateOrderStatus(id, status);
            loadOrders();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <div className="table-card">
            <div className="table-header">
                <h3>Order Fulfillment</h3>
                <span className="badge badge-blue">{orders.length} Orders</span>
            </div>
            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <td style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>{o.id.split('-')[0]}</td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{o.users?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{o.users?.email}</div>
                                </td>
                                <td>
                                    <div>{o.products?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Qty: {o.quantity}</div>
                                </td>
                                <td style={{ fontWeight: 600 }}>${parseFloat(o.total_price).toFixed(2)}</td>
                                <td style={{ color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                <td>
                                    <select
                                        className={`badge badge-${statusColor[o.status] || 'gray'}`}
                                        style={{ border: 'none', appearance: 'none', outline: 'none' }}
                                        value={o.status}
                                        onChange={e => handleStatus(o.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Orders;
