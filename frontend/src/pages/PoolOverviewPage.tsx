import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePool } from 'context/PoolContext';
import { useAuth } from 'context/AuthContext';
import { getPoolProposals, Proposal } from 'services/governanceService';
import { getTreasurySummary, TreasurySummary } from 'services/treasuryService';
import { getPoolCases, LegalCase } from 'services/caseService';
import StatusBadge from 'components/common/StatusBadge';
import TierBadge from 'components/common/TierBadge';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatCurrency, formatDate } from 'utils/formatters';

const PoolOverviewPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { currentPool } = usePool();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasury, setTreasury] = useState<TreasurySummary | null>(null);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poolId) return;
    const load = async () => {
      try {
        const [props, treas, cs] = await Promise.all([
          getPoolProposals(poolId, 'active'),
          getTreasurySummary(poolId),
          getPoolCases(poolId),
        ]);
        setProposals(props.slice(0, 5));
        setTreasury(treas);
        setCases(cs.slice(0, 5));
      } catch (err) {
        console.error('Failed to load pool data:', err);
      }
      setLoading(false);
    };
    load();
  }, [poolId]);

  if (loading) return <LoadingSpinner fullPage text="Loading pool..." />;
  if (!currentPool) return null;

  const isAdmin = currentPool.admins?.includes(user?.uid || '');

  return (
    <div className="fade-in">
      {/* Pool Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{currentPool.name}</h1>
          <TierBadge tier={currentPool.subscriptionTier} />
          <StatusBadge status={currentPool.status} />
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 600 }}>
          {currentPool.description || 'No description provided.'}
        </p>
        {isAdmin && (
          <div style={{ marginTop: 12 }}>
            <Link to={`/pool/${poolId}/settings`} className="btn btn-sm btn-secondary">
              ⚙️ Pool Settings
            </Link>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value">{currentPool.members?.length || 0}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{treasury ? formatCurrency(treasury.balance) : '—'}</div>
          <div className="stat-label">Treasury Balance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{proposals.length}</div>
          <div className="stat-label">Active Proposals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cases.filter(c => c.status !== 'closed').length}</div>
          <div className="stat-label">Open Cases</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Proposals */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Active Proposals</h3>
            <Link to={`/pool/${poolId}/proposals`} style={{ fontSize: 13, fontWeight: 500 }}>View All →</Link>
          </div>
          {proposals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No active proposals</p>
          ) : (
            proposals.map(p => (
              <div key={p.id} style={{
                padding: '12px 0', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {p.votesFor} for / {p.votesAgainst} against • Ends {formatDate(p.deadline)}
                  </p>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))
          )}
        </div>

        {/* Recent Cases */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cases</h3>
            <Link to={`/pool/${poolId}/cases`} style={{ fontSize: 13, fontWeight: 500 }}>View All →</Link>
          </div>
          {cases.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No cases tracked</p>
          ) : (
            cases.map(c => (
              <div key={c.id} style={{
                padding: '12px 0', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.caseType} • {c.courtLevel.replace('_', ' ')}
                  </p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Treasury Summary */}
      {treasury && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>💰 Treasury Summary</h3>
            <Link to={`/pool/${poolId}/treasury`} style={{ fontSize: 13, fontWeight: 500 }}>View Ledger →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total In</p><p style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(treasury.totalContributions)}</p></div>
            <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Out</p><p style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(treasury.totalExpenses)}</p></div>
            <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Balance</p><p style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(treasury.balance)}</p></div>
            <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending</p><p style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(treasury.pendingExpenses)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolOverviewPage;
