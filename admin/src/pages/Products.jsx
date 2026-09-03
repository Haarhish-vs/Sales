import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', category: '', image_url: '' });

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => {
        getProducts()
            .then(res => setProducts(res.products))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const openAdd = () => { setFormData({ name: '', description: '', price: '', stock: '', category: '', image_url: '' }); setModalMode('add'); };
    const openEdit = (p) => { setFormData({ ...p }); setSelectedItem(p); setModalMode('edit'); };
    const close = () => { setModalMode(null); setSelectedItem(null); };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') await createProduct(formData);
            else await updateProduct(selectedItem.id, formData);
            close();
            loadProducts();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete product?')) return;
        try { await deleteProduct(id); loadProducts(); } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-box"><div className="spinner"></div></div>;

    return (
        <>
            <div className="table-card">
                <div className="table-header">
                    <h3>Products Inventory</h3>
                    <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
                </div>
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--dim)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-gray">{p.category}</span></td>
                                    <td style={{ fontWeight: 600 }}>${parseFloat(p.price).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge badge-${p.stock > 0 ? 'green' : 'red'}`}>{p.stock}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMode && (
                <div className="modal-overlay" onClick={close}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">
                            <h3>{modalMode === 'add' ? 'Add Product' : 'Edit Product'}</h3>
                            <button className="modal-close" onClick={close}>✕</button>
                        </div>
                        <form onSubmit={handleSave} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Price ($)</label>
                                    <input type="number" step="0.01" className="form-input" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stock</label>
                                    <input type="number" className="form-input" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input className="form-input" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image URL</label>
                                <input className="form-input" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{modalMode === 'add' ? 'Add Product' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Products;
