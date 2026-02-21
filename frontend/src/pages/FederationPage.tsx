import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPoolFederations, getFederationLedger, createFederation, joinFederation, contributeTroFederation, Federation, FederationLedgerEntry } from 'services/federationService';
import { useNotifications } from 'context/NotificationContext';
import FeatureGate from 'components/common/FeatureGate';
import StatusBadge from 'components/common/StatusBadge';
import EmptyState from 'components/common/EmptyState';
import Modal from 'components/common/Modal';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from 'utils/formatters';

const FederationPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { addNotification } = useNotifications();
  const [federations, setFederations] = useState<Federation[]>([]);
  const [selectedFed, setSelectedFed] = useState<Federation | null>(null);
  const [ledger, setLedger] = useState<FederationLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFed, setNewFed] = useState({ title: '', description: '', governanceModel: 'equal' as Federation['governanceModel'] });

  useEffect(() => {
    if (!poolId) return;
    const load = async () => {
      try { setFederations(await getPoolFederations(poolId)); } catch {}
      setLoading(false);
    };
    load();
  }, [poolId]);

  const handleSelectFed = async (fed: Federation) => {
    setSelectedFed(fed);
    try { setLedger(await getFederationLedger(fed.id)); } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFederation(newFed);
      addNotification('success', 'Federation created!');
      setShowCreate(false);
      if (poolId) setFederations(await getPoolFederations(poolId));
    } catch (err: any) { addNotification('error', err.message); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <FeatureGate feature="federation_alliances">
      <div className="fade-in">
        <div className="page-header">
          <h1>🏛️ Federation</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Federation</button>
        </div>

        {federations.length === 0 ? (
          <EmptyState icon="🏛️" title="No federations" description="Create or join a federation to unite with other pools."
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Federation</button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Federation List */}
            <div>
              <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>Your Federations</h3>
              {federations.map(f => (
                <div key={f.id} className="card" style={{ marginBottom: 12, cursor: 'pointer',
                  border: selectedFed?.id === f.id ? '2px solid var(--primary)' : undefined }}
                  onClick={() => handleSelectFed(f)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.description}</p>
                    </div>
                    <StatusBadge status={f.status} size="sm" />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>👥 {f.memberPools.length} pools</span>
                    <span>💰 {formatCurrency(f.sharedTreasury?.balance || 0)}</span>
                    <span>🗳️ {f.governanceModel}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Federation Detail / Ledger */}
            <div>
              {selectedFed ? (
                <>
                  <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
                    War Chest — {selectedFed.title}
                  </h3>
                  <div className="stat-card" style={{ marginBottom: 16 }}>
                    <div className="stat-value">{formatCurrency(selectedFed.sharedTreasury?.balance || 0)}</div>
                    <div className="stat-label">Shared Treasury Balance</div>
                  </div>
                  {ledger.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
                  ) : (
                    ledger.map(l => (
                      <div key={l.id} style={{
                        padding: '10px 0', borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', fontSize: 13,
                      }}>
                        <div>
                          <p style={{ fontWeight: 600 }}>{l.description}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(l.createdAt)}</p>
                        </div>
                        <span style={{ fontWeight: 700, color: l.type === 'contribution' ? 'var(--success)' : 'var(--danger)' }}>
                          {l.type === 'contribution' ? '+' : '-'}{formatCurrency(l.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select a federation to view details
                </div>
              )}
            </div>
          </div>
        )}

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Federation">
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Name</label>
              <input className="input" value={newFed.title} onChange={e => setNewFed({...newFed, title: e.target.value})} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Description</label>
              <textarea className="textarea" value={newFed.description} onChange={e => setNewFed({...newFed, description: e.target.value})} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Governance Model</label>
              <select className="select" value={newFed.governanceModel}
                onChange={e => setNewFed({...newFed, governanceModel: e.target.value as Federation['governanceModel']})}>
                <option value="equal">Equal (1 pool = 1 vote)</option>
                <option value="weighted">Weighted (by contribution)</option>
                <option value="delegated">Delegated</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      </div>
    </FeatureGate>
  );
};

export default FederationPage;
