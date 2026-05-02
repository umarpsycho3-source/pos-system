import React, { useState } from 'react';
import { Lock, Mail, Phone, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import './Login.css';

export default function Login() {
  const [shopCode, setShopCode] = useState('DEMO');
  const [pin, setPin] = useState('1234');
  const [localError, setLocalError] = useState('');
  const { login, error, loading } = useSettings();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!shopCode.trim() || !pin.trim()) {
      setLocalError('Shop code and PIN are required.');
      return;
    }

    try {
      await login(shopCode.trim(), pin.trim());
    } catch {
      // error shown from context
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        <div className="login-header">
          <Lock size={40} className="text-primary mb-4" />
          <h2>Retail POS Login</h2>
          <p className="text-secondary">Enter your shop code and PIN</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={16} className="text-secondary" />
              <input
                type="text"
                className="login-input"
                placeholder="Shop Code (e.g. DEMO)"
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <input
              type="password"
              className="login-input"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          {(localError || error) && <p className="text-danger mt-2">{localError || error}</p>}
          <button type="submit" className="btn btn-primary w-full mt-4" style={{ height: '50px', fontSize: '1.2rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Unlock'}
          </button>
        </form>

        <div className="login-support">
          <h4>Need Support or Setup Assistance?</h4>
          <p>Contact your system administrator for shop onboarding, hardware configuration, or troubleshooting.</p>
          <div className="support-contact">
            <div className="contact-item">
              <Phone size={16} />
              <span>+94 77 181 3023 (Call / WhatsApp)</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>umarxgamer04@gmail.com</span>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/admin/login" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
