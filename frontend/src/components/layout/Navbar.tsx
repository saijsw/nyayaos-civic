import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { logout } from 'services/authService';
import { getInitials } from 'utils/formatters';

const Navbar: React.FC = () => {
  const { user, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      height: 'var(--navbar-height)', background: 'white',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: 'var(--primary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14,
        }}>
          NC
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
          NyayaOS <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Civic</span>
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            {isSuperAdmin && (
              <Link to="/admin" className="btn btn-sm btn-secondary" style={{ fontSize: 12 }}>
                ⚙️ Admin
              </Link>
            )}
            <Link to="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--primary-bg)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {getInitials(profile?.displayName || user.email || 'U')}
              </div>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                Logout
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn btn-sm btn-secondary">Log In</Link>
            <Link to="/register" className="btn btn-sm btn-primary">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
