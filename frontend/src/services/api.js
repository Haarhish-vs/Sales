const API_BASE = import.meta.env.VITE_API_URL || 'https://sales-hkhf.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
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

// Auth
export const register = (body) =>
    fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const login = (body) =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

// Users
export const getProfile = () =>
    fetch(`${API_BASE}/users/profile`, { headers: getHeaders() }).then(handle);

export const updateProfile = (body) =>
    fetch(`${API_BASE}/users/profile`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

// Products
export const getProducts = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/products${query ? `?${query}` : ''}`, { headers: getHeaders() }).then(handle);
};

export const getProduct = (id) =>
    fetch(`${API_BASE}/products/${id}`, { headers: getHeaders() }).then(handle);

export const createProduct = (body) =>
    fetch(`${API_BASE}/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const updateProduct = (id, body) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const deleteProduct = (id) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

// Orders
export const createOrder = (body) =>
    fetch(`${API_BASE}/orders`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const getMyOrders = () =>
    fetch(`${API_BASE}/orders/my`, { headers: getHeaders() }).then(handle);

// Contact
export const sendContact = (body) =>
    fetch(`${API_BASE}/contact`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);
