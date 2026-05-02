import React, { useMemo, useState } from 'react';
import { Calendar, RotateCcw, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Table.css';
import './Reports.css';

const toYmd = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isWithinRange = (iso, fromYmd, toYmdVal) => {
  const t = new Date(iso || 0).getTime();
  if (Number.isNaN(t)) return false;
  if (fromYmd) {
    const from = new Date(`${fromYmd}T00:00:00.000`).getTime();
    if (t < from) return false;
  }
  if (toYmdVal) {
    const to = new Date(`${toYmdVal}T23:59:59.999`).getTime();
    if (t > to) return false;
  }
  return true;
};

export default function Reports() {
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toYmd(today));
  const [to, setTo] = useState(toYmd(today));
  const [busyId, setBusyId] = useState('');
  const { currency, sales, deleteSale, returnSale, error, setError } = useSettings();
  const [returning, setReturning] = useState(null); // sale
  const [returnItems, setReturnItems] = useState([]);

  const filtered = useMemo(() => {
    return (sales || [])
      .filter((s) => isWithinRange(s.createdAt, from, to))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, from, to]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const count = filtered.filter((s) => s.type !== 'Return').length;
    const returns = filtered.filter((s) => s.type === 'Return').length;
    return { gross, count, returns };
  }, [filtered]);

  const onDelete = async (id) => {
    if (!confirm('Delete this sale? This cannot be undone.')) return;
    setError('');
    setBusyId(id);
    try {
      await deleteSale(id);
    } finally {
      setBusyId('');
    }
  };

  const onReturn = async (id) => {
    const sale = (sales || []).find((s) => String(s.id) === String(id));
    if (!sale) return;
    const items = Array.isArray(sale.items) ? sale.items : [];
    setReturnItems(items.map((it) => ({ id: it.id, name: it.name, maxQty: Number(it.qty || 0), qty: Number(it.qty || 0) })));
    setReturning(sale);
  };

  const submitPartialReturn = async (e) => {
    e.preventDefault();
    if (!returning) return;
    const items = returnItems
      .map((it) => ({ id: it.id, qty: Number(it.qty || 0) }))
      .filter((it) => it.qty > 0);

    if (items.length === 0) {
      setError('Select at least 1 item quantity to return.');
      return;
    }

    setError('');
    setBusyId(returning.id);
    try {
      await returnSale(returning.id, items);
      setReturning(null);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header glass-panel">
        <div className="header-actions-left reports-filters">
          <div className="filter-item">
            <Calendar size={18} className="text-secondary" />
            <input className="search-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <Calendar size={18} className="text-secondary" />
            <input className="search-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="reports-summary">
          <div className="badge badge-primary">Sales: {totals.count}</div>
          <div className="badge badge-warning">Returns: {totals.returns}</div>
          <div className="badge badge-success">Net: {currency}{totals.gross.toFixed(2)}</div>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>ID</th>
              <th>Type</th>
              <th>Method</th>
              <th>Total</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-secondary" style={{ padding: '1.5rem' }}>
                  No sales found for selected dates.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className={s.type === 'Return' ? 'return-row' : ''}>
                  <td className="text-secondary">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="text-secondary">{s.id}</td>
                  <td>
                    <span className={`badge ${s.type === 'Return' ? 'badge-warning' : s.status === 'Returned' ? 'badge-warning' : 'badge-success'}`}>
                      {s.type || s.status || 'Sale'}
                    </span>
                  </td>
                  <td className="text-secondary">{s.method || '-'}</td>
                  <td className={Number(s.total || 0) < 0 ? 'text-warning font-medium' : 'font-medium'}>
                    {currency}{Number(s.total || 0).toFixed(2)}
                  </td>
                  <td className="text-secondary">{Array.isArray(s.items) ? s.items.length : 0}</td>
                  <td>
                    <div className="action-buttons">
                      {s.type !== 'Return' && s.status !== 'Returned' && (
                        <button className="btn-icon text-warning" onClick={() => onReturn(s.id)} disabled={busyId === s.id} title="Return">
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button className="btn-icon text-danger" onClick={() => onDelete(s.id)} disabled={busyId === s.id} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {returning && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '560px' }}>
            <div className="modal-header">
              <h2>Partial Return</h2>
              <button className="btn-icon" onClick={() => setReturning(null)} title="Close">
                ✕
              </button>
            </div>

            <div className="text-secondary" style={{ marginBottom: '0.75rem' }}>
              Sale ID: {returning.id}
            </div>

            <form onSubmit={submitPartialReturn} className="form-grid">
              {returnItems.map((it) => (
                <div key={it.id} className="return-item-row">
                  <div className="return-item-name">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-secondary text-sm">Max: {it.maxQty}</div>
                  </div>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    step="1"
                    max={it.maxQty}
                    value={it.qty}
                    onChange={(e) =>
                      setReturnItems((prev) =>
                        prev.map((x) =>
                          x.id === it.id ? { ...x, qty: Math.max(0, Math.min(it.maxQty, Number(e.target.value || 0))) } : x
                        )
                      )
                    }
                  />
                </div>
              ))}

              <button className="btn btn-warning w-full" type="submit" disabled={busyId === returning.id}>
                Confirm Return
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
