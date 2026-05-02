import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Printer, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Table.css';
import './Inventory.css';

const emptyForm = { name: '', category: 'General', price: '', cost: '', stock: '', barcode: '' };

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [printBarcode, setPrintBarcode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { currency, shopName, products, createProduct, updateProduct, deleteProduct, error, setError } = useSettings();

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode || '').includes(searchTerm)),
    [products, searchTerm]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      category: product.category || 'General',
      price: product.price ?? '',
      cost: product.cost ?? '',
      stock: product.stock ?? '',
      barcode: product.barcode || '',
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      stock: Number(form.stock || 0),
      barcode: form.barcode.trim(),
    };

    if (!payload.name || !payload.barcode || Number.isNaN(payload.price)) {
      setError('Product name, barcode, and price are required.');
      return;
    }

    try {
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      setShowModal(false);
    } catch {
      // Error is already set in context
    }
  };

  const handlePrint = () => {
    window.print();
    setPrintBarcode(null);
  };

  const BarcodeModal = () => (
    <div className="modal-overlay print-hide">
      <div className="modal-content glass-panel" style={{ width: '400px' }}>
        <div className="modal-header">
          <h2>Print Barcode</h2>
          <button className="btn-icon" onClick={() => setPrintBarcode(null)}><X size={20} /></button>
        </div>

        <div className="barcode-preview-area print-area">
          <div className="barcode-sticker print-area">
            <h4 className="barcode-company">{shopName}</h4>
            <p className="barcode-product-name">{printBarcode.name}</p>
            <div className="barcode-lines">|| ||| | || ||| || | ||</div>
            <p className="barcode-number">{printBarcode.barcode}</p>
            <p className="barcode-price">{currency}{Number(printBarcode.price || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="modal-actions mt-4">
          <button className="btn btn-primary w-full" onClick={handlePrint}>
            <Printer size={20} /> Print Label
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header glass-panel">
        <div className="header-actions-left">
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-glass">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      {error && <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Barcode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>#{product.id}</td>
                <td className="font-medium">{product.name}</td>
                <td><span className="badge badge-primary">{product.category}</span></td>
                <td>{currency}{Number(product.price || 0).toFixed(2)}</td>
                <td>
                  <span className={`badge ${product.stock > 20 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="text-secondary">{product.barcode}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => setPrintBarcode(product)} title="Print Barcode"><Printer size={16} /></button>
                    <button className="btn-icon" onClick={() => openEdit(product)}><Edit2 size={16} /></button>
                    <button className="btn-icon text-danger" onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '500px' }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setError(''); }}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="form-grid">
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-field" placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>General</option><option>Electronics</option><option>Groceries</option><option>Clothing</option><option>Other</option>
              </select>
              <input className="input-field" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input className="input-field" type="number" step="0.01" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              <input className="input-field" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              <button className="btn btn-primary w-full" type="submit">{editing ? 'Save Changes' : 'Create Product'}</button>
            </form>
          </div>
        </div>
      )}

      {printBarcode && <BarcodeModal />}
    </div>
  );
}
