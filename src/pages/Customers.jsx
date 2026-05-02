import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Table.css';

const emptyForm = { name: '', email: '', phone: '', points: '' };

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { customers, createCustomer, updateCustomer, deleteCustomer, error, setError } = useSettings();

  const filteredCustomers = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [customers, searchTerm]
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (customer) => {
    setEditing(customer);
    setForm({ name: customer.name || '', email: customer.email || '', phone: customer.phone || '', points: customer.points ?? 0 });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, points: Number(form.points || 0) };
    if (!payload.name.trim()) {
      setError('Customer name is required.');
      return;
    }
    try {
      if (editing) await updateCustomer(editing.id, payload);
      else await createCustomer(payload);
      setShowModal(false);
    } catch {
      // Error handled by context
    }
  };

  return (
    <div className="page-container">
      <div className="page-header glass-panel">
        <div className="header-actions-left">
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              placeholder="Search customers..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {error && <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Loyalty Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td className="font-medium">{customer.name}</td>
                <td className="text-secondary">{customer.email || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td><span className="badge badge-success">{Number(customer.points || 0)} pts</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEdit(customer)}><Edit2 size={16} /></button>
                    <button className="btn-icon text-danger" onClick={() => deleteCustomer(customer.id)}><Trash2 size={16} /></button>
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
              <h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setError(''); }}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="form-grid">
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input-field" type="number" placeholder="Loyalty Points" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
              <button className="btn btn-primary w-full" type="submit">{editing ? 'Save Changes' : 'Create Customer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
