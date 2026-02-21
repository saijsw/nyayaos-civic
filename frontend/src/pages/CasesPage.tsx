import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPoolCases, createCase, updateCaseStatus, getCostProjection, LegalCase } from 'services/caseService';
import { useNotifications } from 'context/NotificationContext';
import StatusBadge from 'components/common/StatusBadge';
import EmptyState from 'components/common/EmptyState';
import Modal from 'components/common/Modal';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatDate, formatCurrency } from 'utils/formatters';

const CasesPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { addNotification } = useNotifications();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [newCase, setNewCase] = useState({
    title: '', description: '',
    caseType: 'civil' as LegalCase['caseType'],
    courtLevel: 'district' as LegalCase['courtLevel'],
  });

  const load = async () => {
    if (!poolId) return;
    try {
      const data = await getPoolCases(poolId);
      setCases(data);
    } catch (err) {
      addNotification('error', 'Failed to load cases');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [poolId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolId) return;
    setCreating(true);
    try {
      await createCase({ poolId, ...newCase });
      addNotification('success', 'Case created!');
      setShowCreate(false);
      setNewCase({ title: '', description: '', caseType: 'civil', courtLevel: 'district' });
      load();
    } catch (err: any) {
      addNotification('error', err.message);
    }
    setCreating(false);
  };

  const handleStatusUpdate = async (caseId: string, status: LegalCase['status']) => {
    try {
      await updateCaseStatus(caseId, status);
      addNotification('success', `Status updated to ${status}`);
      load();
    } catch (err: any) {
      addNotification('error', err.message);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const statusFlow: LegalCase['status'][] = ['filing', 'discovery', 'hearing', 'judgment', 'appeal', 'closed'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>⚖️ Cases</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Case</button>
      </div>

      {cases.length === 0 ? (
        <EmptyState icon="⚖️" title="No cases" description="Track your first legal case."
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Add Case</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cases.map(c => (
            <div key={c.id} className="card" style={{ cursor: 'pointer' }}
              onClick={() => setSelectedCase(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{c.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>📋 {c.caseType}</span>
                    <span>🏛️ {c.courtLevel.replace('_', ' ')}</span>
                    {c.nextHearing && <span>📅 Next: {formatDate(c.nextHearing)}</span>}
                    {c.projectedCost && (
                      <span>💰 Est: {formatCurrency(c.projectedCost.min)} - {formatCurrency(c.projectedCost.max)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Pipeline */}
              <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
                {statusFlow.map((s, i) => {
                  const idx = statusFlow.indexOf(c.status);
                  const isComplete = i <= idx;
                  const isCurrent = i === idx;
                  return (
                    <div key={s} style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: isComplete ? (isCurrent ? 'var(--primary)' : 'var(--success)') : 'var(--border)',
                      transition: 'background 0.3s',
                    }} title={s} />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {statusFlow.map(s => <span key={s} style={{ textTransform: 'capitalize' }}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Detail Modal */}
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)}
        title={selectedCase?.title || 'Case Details'} width={600}>
        {selectedCase && (
          <div>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>{selectedCase.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div><span className="label">Type</span><p>{selectedCase.caseType}</p></div>
              <div><span className="label">Court</span><p>{selectedCase.courtLevel.replace('_', ' ')}</p></div>
              <div><span className="label">Filed</span><p>{formatDate(selectedCase.filedDate || null)}</p></div>
              <div><span className="label">Status</span><StatusBadge status={selectedCase.status} /></div>
            </div>
            {selectedCase.status !== 'closed' && (
              <div>
                <span className="label">Update Status</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {statusFlow.filter(s => s !== selectedCase.status).map(s => (
                    <button key={s} className="btn btn-sm btn-secondary" style={{ textTransform: 'capitalize' }}
                      onClick={() => { handleStatusUpdate(selectedCase.id, s); setSelectedCase(null); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Case">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Title</label>
            <input className="input" value={newCase.title}
              onChange={e => setNewCase({...newCase, title: e.target.value})} placeholder="Case title" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Case Type</label>
            <select className="select" value={newCase.caseType}
              onChange={e => setNewCase({...newCase, caseType: e.target.value as LegalCase['caseType']})}>
              <option value="civil">Civil</option><option value="criminal">Criminal</option>
              <option value="constitutional">Constitutional</option><option value="consumer">Consumer</option>
              <option value="environmental">Environmental</option><option value="labor">Labor</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Court Level</label>
            <select className="select" value={newCase.courtLevel}
              onChange={e => setNewCase({...newCase, courtLevel: e.target.value as LegalCase['courtLevel']})}>
              <option value="district">District Court</option><option value="high_court">High Court</option>
              <option value="supreme_court">Supreme Court</option><option value="tribunal">Tribunal</option>
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Description</label>
            <textarea className="textarea" value={newCase.description}
              onChange={e => setNewCase({...newCase, description: e.target.value})} placeholder="Case details..." required />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CasesPage;
