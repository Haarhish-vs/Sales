const API_BASE = import.meta.env.VITE_API_URL || 'https://sales-hkhf.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
};

export const adminLogin = (body) =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

// Dashboard
export const getStats = () =>
    fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() }).then(handle);

// Users
export const getUsers = () =>
    fetch(`${API_BASE}/admin/users`, { headers: getHeaders() }).then(handle);

export const updateUserRole = (id, role) =>
    fetch(`${API_BASE}/admin/users/${id}/role`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }) }).then(handle);

export const deleteUser = (id) =>
    fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

// Products
export const getProducts = (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/products${q ? `?${q}` : ''}`, { headers: getHeaders() }).then(handle);
};

export const createProduct = (body) =>
    fetch(`${API_BASE}/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const updateProduct = (id, body) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const deleteProduct = (id) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

// Orders
export const getOrders = () =>
    fetch(`${API_BASE}/admin/orders`, { headers: getHeaders() }).then(handle);

export const updateOrderStatus = (id, status) =>
    fetch(`${API_BASE}/admin/orders/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) }).then(handle);

// Messages
export const getMessages = () =>
    fetch(`${API_BASE}/admin/messages`, { headers: getHeaders() }).then(handle);

export const deleteMessage = (id) =>
    fetch(`${API_BASE}/admin/messages/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

// Site Settings
export const getSettings = () =>
    fetch(`${API_BASE}/admin/settings`, { headers: getHeaders() }).then(handle);

export const updateSettings = (body) =>
    fetch(`${API_BASE}/admin/settings`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);
