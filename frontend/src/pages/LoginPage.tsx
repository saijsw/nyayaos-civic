import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, resetPassword } from 'services/authService';
import { useNotifications } from 'context/NotificationContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      addNotification('error', err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      addNotification('error', err.message || 'Google login failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { addNotification('warning', 'Enter your email first'); return; }
    try {
      await resetPassword(email);
      addNotification('success', 'Password reset email sent!');
    } catch (err: any) {
      addNotification('error', err.message);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--navbar-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sign in to your NyayaOS Civic account
        </p>

        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <button type="button" onClick={handleForgotPassword}
              style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 13, fontWeight: 500 }}>
              Forgot password?
            </button>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          margin: '20px 0', color: 'var(--text-muted)', fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button className="btn btn-secondary btn-lg" style={{ width: '100%' }}
          onClick={handleGoogleLogin} disabled={loading}>
          🔵 Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
