import React, { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, Store, Printer, Monitor, Smartphone, HeartHandshake, Phone, Mail, Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Table.css';

export default function Settings() {
  const { currency, shopName, updateSettings, error, usingFallback } = useSettings();
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [draftShopName, setDraftShopName] = useState(shopName);

  const handleSave = async () => {
    await updateSettings({ currency: draftCurrency, shopName: draftShopName.trim() || 'My Retail Shop' });
    alert('Settings saved successfully.');
  };

  return (
    <div className="page-container">
      <div className="page-header glass-panel">
        <div className="header-actions-left">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><SettingsIcon size={24} /> Store Preferences</h2>
        </div>
        <button className="btn btn-primary" onClick={handleSave}><Save size={20} /><span>Save Changes</span></button>
      </div>

      {usingFallback && <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--warning-color)', marginBottom: '1rem' }}>Backend offline: settings are being saved locally.</div>}
      {error && <div className="glass-panel" style={{ padding: '0.75rem 1rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>General Settings</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>System Currency Symbol</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: 'fit-content', gap: '1rem' }}>
              <DollarSign size={18} className="text-secondary" />
              <select value={draftCurrency} onChange={(e) => setDraftCurrency(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none', padding: '0.5rem', cursor: 'pointer' }}>
                <option value="LKR " style={{ color: 'black' }}>LKR (Sri Lankan Rupee)</option>
                <option value="$" style={{ color: 'black' }}>$ (US Dollar)</option>
                <option value="EUR " style={{ color: 'black' }}>EUR (Euro)</option>
                <option value="GBP " style={{ color: 'black' }}>GBP (British Pound)</option>
                <option value="Rs. " style={{ color: 'black' }}>Rs. (Indian Rupee)</option>
              </select>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This symbol will be displayed across all dashboards and receipts.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Shop Name</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: '100%', maxWidth: '400px', gap: '1rem' }}>
              <Store size={18} className="text-secondary" />
              <input type="text" value={draftShopName} onChange={(e) => setDraftShopName(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none', width: '100%' }} placeholder="Enter your shop name" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This name will be printed on your checkout receipts and barcode stickers.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel mt-4" style={{ padding: '2rem', maxWidth: '800px', margin: '1.5rem auto', width: '100%' }}>
        <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Monitor size={20} /> Hardware & Integrations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={16} /> Receipt & Barcode Printers</h4><p>Install manufacturer drivers, then use the browser print dialog to select your receipt printer and set paper to 80mm.</p></div>
          <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={16} /> Barcode Scanners</h4><p>USB/Bluetooth scanners act as keyboards. Keep cursor in POS scanner input and scan to add products instantly.</p></div>
          <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Cash Drawers</h4><p>Connect via RJ11/RJ12 to receipt printer and configure printer properties to auto-open drawer before print jobs.</p></div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)' }}><HeartHandshake size={20} /> System Support & Guidelines</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>For customizations, hardware setup, and troubleshooting support, contact the developer.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ background: 'var(--primary-color)', padding: '0.75rem', borderRadius: '50%' }}><Phone size={20} color="white" /></div><div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Call or WhatsApp</p><p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>+94 77 181 3023</p></div></div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ background: 'var(--primary-color)', padding: '0.75rem', borderRadius: '50%' }}><Mail size={20} color="white" /></div><div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Support</p><p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>umarxgamer04@gmail.com</p></div></div>
        </div>
      </div>
    </div>
  );
}
