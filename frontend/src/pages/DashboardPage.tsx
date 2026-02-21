import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { getUserPools, getPublicPools, createPool, Pool } from 'services/poolService';
import LoadingSpinner from 'components/common/LoadingSpinner';
import StatusBadge from 'components/common/StatusBadge';
import TierBadge from 'components/common/TierBadge';
import EmptyState from 'components/common/EmptyState';
import Modal from 'components/common/Modal';
import { useNotifications } from 'context/NotificationContext';
import { formatDate } from 'utils/formatters';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [myPools, setMyPools] = useState<Pool[]>([]);
  const [publicPools, setPublicPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPool, setNewPool] = useState({ name: '', description: '', visibility: 'public' as const });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [my, pub] = await Promise.all([
          getUserPools(user.uid),
          getPublicPools(10),
        ]);
        setMyPools(my);
        setPublicPools(pub.filter(p => !my.some(m => m.id === p.id)));
      } catch (err: any) {
        addNotification('error', 'Failed to load pools');
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPool.name.trim()) return;
    setCreating(true);
    try {
      const result = await createPool({
        name: newPool.name,
        description: newPool.description,
        createdBy: user.uid,
        visibility: newPool.visibility,
      });
      addNotification('success', 'Pool created!');
      setShowCreate(false);
      setNewPool({ name: '', description: '', visibility: 'public' });
      // Reload pools
      const updated = await getUserPools(user.uid);
      setMyPools(updated);
    } catch (err: any) {
      addNotification('error', err.message || 'Failed to create pool');
    }
    setCreating(false);
  };

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Welcome back, {profile?.displayName || 'there'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Pool
        </button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value">{myPools.length}</div>
          <div className="stat-label">My Pools</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{myPools.filter(p => p.subscriptionTier !== 'free').length}</div>
          <div className="stat-label">Premium Pools</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile?.reputation?.score || 0}</div>
          <div className="stat-label">Reputation Score</div>
        </div>
      </div>

      {/* My Pools */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Pools</h2>
      {myPools.length === 0 ? (
        <EmptyState
          icon="🏊"
          title="No pools yet"
          description="Create your first pool to start organizing."
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Pool</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 40 }}>
          {myPools.map(pool => (
            <Link key={pool.id} to={`/pool/${pool.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{pool.name}</h3>
                  <TierBadge tier={pool.subscriptionTier} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
                  {pool.description || 'No description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    👥 {pool.members?.length || 0} members
                  </span>
                  <StatusBadge status={pool.status} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Discover Public Pools */}
      {publicPools.length > 0 && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Discover Public Pools</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {publicPools.map(pool => (
              <div key={pool.id} className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{pool.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                  {pool.description || 'No description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    👥 {pool.members?.length || 0} members
                  </span>
                  <Link to={`/pool/${pool.id}`} className="btn btn-sm btn-secondary">View</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Pool Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Pool">
        <form onSubmit={handleCreatePool}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Pool Name</label>
            <input className="input" value={newPool.name} onChange={e => setNewPool({...newPool, name: e.target.value})}
              placeholder="e.g. Neighborhood Legal Aid" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Description</label>
            <textarea className="textarea" value={newPool.description}
              onChange={e => setNewPool({...newPool, description: e.target.value})}
              placeholder="What is this pool about?" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Visibility</label>
            <select className="select" value={newPool.visibility}
              onChange={e => setNewPool({...newPool, visibility: e.target.value as 'public' | 'private'})}>
              <option value="public">Public</option>
              <option value="private">Private (Pro required)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
