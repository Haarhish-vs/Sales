import React, { useEffect, useState } from 'react';
import { getMessages, deleteMessage } from '../services/api';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadMessages(); }, []);

    const loadMessages = () => {
        getMessages()
            .then(res => setMessages(res.messages))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete message?')) return;
        try { await deleteMessage(id); loadMessages(); } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <div className="table-card">
            <div className="table-header">
                <h3>Contact Enquiries</h3>
                <span className="badge badge-blue">{messages.length} Messages</span>
            </div>
            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Sender</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(m => (
                            <tr key={m.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}><a href={`mailto:${m.email}`}>{m.email}</a></div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{m.subject || 'No Subject'}</td>
                                <td style={{ maxWidth: 300 }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{m.message}</div>
                                </td>
                                <td style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>{new Date(m.created_at).toLocaleString()}</td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Messages;
