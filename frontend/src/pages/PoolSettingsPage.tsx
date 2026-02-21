import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePool } from 'context/PoolContext';
import { useAuth } from 'context/AuthContext';
import { updatePoolSettings } from 'services/poolService';
import { useNotifications } from 'context/NotificationContext';
import FeatureGate from 'components/common/FeatureGate';

const PoolSettingsPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { currentPool } = usePool();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    approvalThreshold: 0.5,
    votingDuration: 7,
    allowReputationWeighting: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPool?.governanceSettings) {
      setSettings(currentPool.governanceSettings);
    }
  }, [currentPool]);

  const isAdmin = currentPool?.admins?.includes(user?.uid || '');
  if (!isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Only pool admins can change settings.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!poolId) return;
    setSaving(true);
    try {
      await updatePoolSettings(poolId, settings);
      addNotification('success', 'Settings saved!');
    } catch (err: any) {
      addNotification('error', err.message);
    }
    setSaving(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>⚙️ Pool Settings</h1>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Governance Settings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Governance Rules</h3>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Approval Threshold (%)</label>
            <input className="input" type="number" min="1" max="100" step="1"
              value={Math.round(settings.approvalThreshold * 100)}
              onChange={e => setSettings({ ...settings, approvalThreshold: parseInt(e.target.value) / 100 })} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Percentage of votes needed to pass a proposal
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Voting Duration (days)</label>
            <input className="input" type="number" min="1" max="90"
              value={settings.votingDuration}
              onChange={e => setSettings({ ...settings, votingDuration: parseInt(e.target.value) })} />
          </div>

          <FeatureGate feature="reputation_weighted_voting"
            fallback={
              <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  🔒 Reputation-weighted voting requires Pro tier
                </p>
              </div>
            }>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.allowReputationWeighting}
                  onChange={e => setSettings({ ...settings, allowReputationWeighting: e.target.checked })} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Enable Reputation-Weighted Voting</span>
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginLeft: 26 }}>
                Votes are weighted by member reputation score
              </p>
            </div>
          </FeatureGate>
        </div>

        {/* Pool Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pool Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span className="label">Name</span><p>{currentPool?.name}</p></div>
            <div><span className="label">Tier</span><p style={{ textTransform: 'capitalize' }}>{currentPool?.subscriptionTier}</p></div>
            <div><span className="label">Visibility</span><p style={{ textTransform: 'capitalize' }}>{currentPool?.visibility}</p></div>
            <div><span className="label">Members</span><p>{currentPool?.members?.length || 0}</p></div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default PoolSettingsPage;
