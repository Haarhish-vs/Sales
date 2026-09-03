import React, { useEffect, useState } from 'react';
import { getUsers, updateUserRole, deleteUser } from '../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = () => {
        getUsers()
            .then(res => setUsers(res.users))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleRoleChange = async (id, role) => {
        try {
            await updateUserRole(id, role);
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUser(id);
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <div className="table-card">
            <div className="table-header">
                <h3>User Management</h3>
                <span className="badge badge-blue">{users.length} Total</span>
            </div>
            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 500 }}>{u.name}</td>
                                <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                                <td>
                                    <select
                                        className="form-input"
                                        style={{ padding: '4px 8px', width: 'auto' }}
                                        value={u.role}
                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td style={{ color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
