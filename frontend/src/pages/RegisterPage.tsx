import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail, loginWithGoogle } from 'services/authService';
import { useNotifications } from 'context/NotificationContext';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addNotification('error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      addNotification('error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      addNotification('success', 'Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      addNotification('error', err.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      addNotification('error', err.message || 'Google sign-up failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--navbar-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Join NyayaOS Civic and start building civic power
        </p>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Full Name</label>
            <input className="input" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0',
          color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button className="btn btn-secondary btn-lg" style={{ width: '100%' }}
          onClick={handleGoogleSignup} disabled={loading}>
          🔵 Sign up with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
