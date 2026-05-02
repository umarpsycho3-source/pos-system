import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Table.css';
import './AdminShops.css';

const ADMIN_TOKEN_STORAGE = 'pos_admin_token';

export default function AdminShops() {
  const [shopCode, setShopCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [pin, setPin] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const adminToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE) || '';

  const load = async () => {
    setError('');
    setSuccess('');
    if (!adminToken()) return navigate('/admin/login');
    setLoading(true);
    try {
      const list = await api.admin.listShops(adminToken());
      setShops(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || 'Failed to load shops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminToken()) navigate('/admin/login');
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      shopCode: shopCode.trim().toUpperCase(),
      shopName: shopName.trim(),
      pin: pin.trim(),
    };

    if (!adminToken()) return navigate('/admin/login');
    if (!payload.shopCode || !payload.shopName || !payload.pin) return setError('Shop code, shop name and PIN are required.');

    setLoading(true);
    try {
      await api.admin.createShop(payload, adminToken());
      setShopCode('');
      setShopName('');
      setPin('');
      setSuccess('Shop created successfully.');
      await load();
    } catch (e2) {
      setError(e2.message || 'Failed to create shop.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE);
    navigate('/admin/login');
  };

  return (
    <div className="page-container">
      <div className="glass-panel admin-banner">
        <div className="admin-title">
          <h2>Admin: Shops</h2>
          <p className="text-secondary">Create shop accounts (shop code + PIN). This page is admin-only.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="glass-panel admin-card">
          <h3>Admin Session</h3>
          <div className="input-group">
            <div className="admin-actions">
              <button className="btn btn-primary" type="button" onClick={load} disabled={!adminToken() || loading}>
                <RefreshCw size={18} /> Refresh Shops
              </button>
              <button className="btn btn-danger" type="button" onClick={logout} disabled={loading}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel admin-card">
          <h3>Create Shop</h3>
          <form onSubmit={create} className="form-grid">
            <input className="input-field" placeholder="Shop Code (e.g. SHOP01)" value={shopCode} onChange={(e) => setShopCode(e.target.value)} />
            <input className="input-field" placeholder="Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            <input className="input-field" placeholder="PIN (numbers)" value={pin} onChange={(e) => setPin(e.target.value)} />
            <button className="btn btn-success w-full" type="submit" disabled={loading}>
              <Plus size={18} /> Create Shop
            </button>
          </form>
        </div>
      </div>

      {(error || success) && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginTop: '1rem', color: error ? 'var(--danger-color)' : 'var(--success-color)' }}>
          {error || success}
        </div>
      )}

      <div className="table-container glass-panel" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-secondary" style={{ padding: '1.5rem' }}>
                  No shops loaded yet. Enter master key and click “Refresh Shops”.
                </td>
              </tr>
            ) : (
              shops.map((s) => (
                <tr key={s.id}>
                  <td className="text-secondary">{s.id}</td>
                  <td className="font-medium">{s.code}</td>
                  <td>{s.name}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
