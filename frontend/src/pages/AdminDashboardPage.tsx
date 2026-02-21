import React, { useState, useEffect } from 'react';
import { useAuth } from 'context/AuthContext';
import { getAdminStats, getAuditLogs, togglePoolFreeze, approveTierUpgrade, AdminStats, AuditLogEntry } from 'services/adminService';
import { getPublicPools, Pool } from 'services/poolService';
import { useNotifications } from 'context/NotificationContext';
import StatusBadge from 'components/common/StatusBadge';
import TierBadge from 'components/common/TierBadge';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatDateTime } from 'utils/formatters';

const AdminDashboardPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pools' | 'audit'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, l] = await Promise.all([
          getAdminStats(), getPublicPools(100), getAuditLogs(50),
        ]);
        setStats(s);
        setPools(p);
        setLogs(l);
      } catch (err) {
        addNotification('error', 'Failed to load admin data');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>🚫 Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Super Admin access required.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner fullPage text="Loading admin panel..." />;

  const handleFreeze = async (poolId: string, freeze: boolean) => {
    try {
      await togglePoolFreeze(poolId, freeze);
      addNotification('success', `Pool ${freeze ? 'frozen' : 'unfrozen'}`);
      setPools(await getPublicPools(100));
    } catch (err: any) { addNotification('error', err.message); }
  };

  const handleUpgrade = async (poolId: string, tier: 'pro' | 'federation') => {
    try {
      await approveTierUpgrade(poolId, tier);
      addNotification('success', `Tier upgraded to ${tier}`);
      setPools(await getPublicPools(100));
    } catch (err: any) { addNotification('error', err.message); }
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>⚙️ Super Admin Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Global platform management</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 2 }}>
        {(['overview', 'pools', 'audit'] as const).map(tab => (
          <button key={tab} className="btn btn-sm"
            style={{
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              textTransform: 'capitalize', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            }}
            onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div className="stat-card"><div className="stat-value">{stats.totalPools}</div><div className="stat-label">Total Pools</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
            <div className="stat-card"><div className="stat-value">{stats.activeProposals}</div><div className="stat-label">Active Proposals</div></div>
            <div className="stat-card"><div className="stat-value">{stats.activeFederations}</div><div className="stat-label">Federations</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.frozenPools}</div><div className="stat-label">Frozen Pools</div></div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Civic Impact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <p className="label">Total Treasury Volume</p>
                <p style={{ fontSize: 24, fontWeight: 800 }}>₹{(stats.totalTreasuryVolume || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="label">Platform Health</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
                  {stats.frozenPools === 0 ? '✓ All Clear' : `⚠ ${stats.frozenPools} frozen`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pools Management Tab */}
      {activeTab === 'pools' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Pool</th><th>Tier</th><th>Members</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pools.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><TierBadge tier={p.subscriptionTier} /></td>
                  <td>{p.members?.length || 0}</td>
                  <td><StatusBadge status={p.status} size="sm" /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary"
                        onClick={() => handleFreeze(p.id, p.status !== 'frozen')}>
                        {p.status === 'frozen' ? '🔓 Unfreeze' : '🔒 Freeze'}
                      </button>
                      {p.subscriptionTier === 'free' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleUpgrade(p.id, 'pro')}>
                          ⬆️ Pro
                        </button>
                      )}
                      {p.subscriptionTier === 'pro' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleUpgrade(p.id, 'federation')}>
                          ⬆️ Fed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Time</th><th>Action</th><th>By</th><th>Target</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(l.timestamp)}</td>
                  <td><span className="badge badge-neutral">{l.action}</span></td>
                  <td style={{ fontSize: 13 }}>{l.performedBy}</td>
                  <td style={{ fontSize: 13 }}>{l.targetType}: {l.targetId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
