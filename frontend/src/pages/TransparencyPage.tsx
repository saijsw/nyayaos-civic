import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPool, getPublicPools, Pool } from 'services/poolService';
import { getTreasurySummary, TreasurySummary } from 'services/treasuryService';
import { getPoolProposals, Proposal } from 'services/governanceService';
import { getPoolCases, LegalCase } from 'services/caseService';
import StatusBadge from 'components/common/StatusBadge';
import TierBadge from 'components/common/TierBadge';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatCurrency, formatDate } from 'utils/formatters';

const TransparencyPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [treasury, setTreasury] = useState<TreasurySummary | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [publicPools, setPublicPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (poolId) {
        try {
          const [p, t, pr, c] = await Promise.all([
            getPool(poolId), getTreasurySummary(poolId),
            getPoolProposals(poolId), getPoolCases(poolId),
          ]);
          setPool(p);
          setTreasury(t);
          setProposals(pr);
          setCases(c);
        } catch {}
      } else {
        try { setPublicPools(await getPublicPools(50)); } catch {}
      }
      setLoading(false);
    };
    load();
  }, [poolId]);

  if (loading) return <LoadingSpinner fullPage text="Loading transparency data..." />;

  // If no poolId, show list of public pools
  if (!poolId) {
    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>🔍 Public Transparency</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Browse publicly transparent pools and their governance data.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {publicPools.map(p => (
            <a key={p.id} href={`/transparency/${p.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                <TierBadge tier={p.subscriptionTier} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.description}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>👥 {p.members?.length || 0} members</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (!pool) return <div style={{ padding: 60, textAlign: 'center' }}><h2>Pool not found or is private</h2></div>;

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>🔍 {pool.name}</h1>
          <TierBadge tier={pool.subscriptionTier} />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>{pool.description}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Public transparency page • {pool.members?.length || 0} members • Created {formatDate(pool.createdAt)}
        </p>
      </div>

      {/* Treasury */}
      {treasury && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💰 Treasury</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div><p className="label">Total In</p><p style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(treasury.totalContributions)}</p></div>
            <div><p className="label">Total Out</p><p style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(treasury.totalExpenses)}</p></div>
            <div><p className="label">Balance</p><p style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(treasury.balance)}</p></div>
          </div>
        </div>
      )}

      {/* Proposals */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🗳️ Proposals ({proposals.length})</h2>
        {proposals.slice(0, 10).map(p => (
          <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.votesFor} for / {p.votesAgainst} against</p>
            </div>
            <StatusBadge status={p.status} size="sm" />
          </div>
        ))}
      </div>

      {/* Cases */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⚖️ Cases ({cases.length})</h2>
        {cases.map(c => (
          <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.caseType} • {c.courtLevel.replace('_', ' ')}</p>
            </div>
            <StatusBadge status={c.status} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransparencyPage;
