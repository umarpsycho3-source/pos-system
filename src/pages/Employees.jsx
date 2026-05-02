import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Table.css';

const emptyForm = { name: '', role: 'Cashier', status: 'Active' };

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { employees, createEmployee, updateEmployee, deleteEmployee, error, setError } = useSettings();

  const filteredEmployees = useMemo(
    () => employees.filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || (e.role || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [employees, searchTerm]
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (employee) => {
    setEditing(employee);
    setForm({ name: employee.name || '', role: employee.role || 'Cashier', status: employee.status || 'Active' });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    try {
      if (editing) await updateEmployee(editing.id, payload);
      else await createEmployee(payload);
      setShowModal(false);
    } catch {
      // handled by context
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
              placeholder="Search staff..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={20} />
          <span>Add Employee</span>
        </button>
      </div>

      {error && <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td className="font-medium">{emp.name}</td>
                <td>
                  <span className={`badge ${emp.role === 'Manager' ? 'badge-primary' : 'badge-warning'}`}>
                    {emp.role === 'Manager' && <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                    {emp.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {emp.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEdit(emp)}><Edit2 size={16} /></button>
                    <button className="btn-icon text-danger" onClick={() => deleteEmployee(emp.id)}><Trash2 size={16} /></button>
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
              <h2>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setError(''); }}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="form-grid">
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option>Cashier</option><option>Manager</option><option>Supervisor</option>
              </select>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option><option>Inactive</option>
              </select>
              <button className="btn btn-primary w-full" type="submit">{editing ? 'Save Changes' : 'Create Employee'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
