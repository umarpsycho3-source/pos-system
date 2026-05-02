import React, { useState } from 'react';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

const ADMIN_TOKEN_STORAGE = 'pos_admin_token';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const session = await api.admin.login({ email: email.trim(), password: password.trim() });
      localStorage.setItem(ADMIN_TOKEN_STORAGE, session.token);
      navigate('/admin/shops');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        <div className="login-header">
          <KeyRound size={40} className="text-primary mb-4" />
          <h2>Admin Login</h2>
          <p className="text-secondary">Enter admin email and password</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} className="text-secondary" />
              <input
                type="email"
                className="login-input"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} className="text-secondary" />
              <input
                type="password"
                className="login-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-danger mt-2">{error}</p>}
          <button type="submit" className="btn btn-primary w-full mt-4" style={{ height: '50px', fontSize: '1.2rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-support">
          <h4>Security Note</h4>
          <p>Do not share admin credentials with shops. Admin pages are protected by server authentication.</p>
        </div>
      </div>
    </div>
  );
}

