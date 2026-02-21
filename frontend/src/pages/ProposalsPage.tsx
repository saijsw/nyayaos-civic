import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { usePool } from 'context/PoolContext';
import { getPoolProposals, createProposal, castVote, Proposal } from 'services/governanceService';
import { useNotifications } from 'context/NotificationContext';
import StatusBadge from 'components/common/StatusBadge';
import EmptyState from 'components/common/EmptyState';
import Modal from 'components/common/Modal';
import LoadingSpinner from 'components/common/LoadingSpinner';
import { formatDate, formatPercent } from 'utils/formatters';

const ProposalsPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { user } = useAuth();
  const { currentPool } = usePool();
  const { addNotification } = useNotifications();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', type: 'policy' as Proposal['type'] });

  const loadProposals = async () => {
    if (!poolId) return;
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter as Proposal['status'];
      const data = await getPoolProposals(poolId, status);
      setProposals(data);
    } catch (err: any) {
      addNotification('error', 'Failed to load proposals');
    }
    setLoading(false);
  };

  useEffect(() => { loadProposals(); }, [poolId, filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolId) return;
    setCreating(true);
    try {
      await createProposal({ poolId, ...newProposal });
      addNotification('success', 'Proposal created!');
      setShowCreate(false);
      setNewProposal({ title: '', description: '', type: 'policy' });
      loadProposals();
    } catch (err: any) {
      addNotification('error', err.message || 'Failed to create proposal');
    }
    setCreating(false);
  };

  const handleVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      await castVote(proposalId, vote);
      addNotification('success', `Vote cast: ${vote}`);
      loadProposals();
    } catch (err: any) {
      addNotification('error', err.message || 'Failed to vote');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Proposals</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Proposal</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'active', 'passed', 'rejected', 'expired'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Proposal List */}
      {proposals.length === 0 ? (
        <EmptyState icon="📋" title="No proposals found" description="Create the first proposal for this pool."
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Proposal</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {proposals.map(p => {
            const totalVotes = p.votesFor + p.votesAgainst;
            const pct = totalVotes > 0 ? p.votesFor / totalVotes : 0;
            const hasVoted = user?.uid ? !!p.votes?.[user.uid] : false;

            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
                      <StatusBadge status={p.status} size="sm" />
                      <span className="badge badge-neutral">{p.type}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.description}</p>
                  </div>
                </div>

                {/* Vote Progress Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--success)' }}>✓ {p.votesFor} For ({totalVotes > 0 ? formatPercent(pct) : '0%'})</span>
                    <span style={{ color: 'var(--danger)' }}>✕ {p.votesAgainst} Against</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, background: pct >= (p.approvalThreshold || 0.5) ? 'var(--success)' : 'var(--warning)', borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Threshold: {formatPercent(p.approvalThreshold || 0.5)} • Deadline: {formatDate(p.deadline)}
                  </div>
                </div>

                {/* Vote Buttons */}
                {p.status === 'active' && !hasVoted && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: '#d1fae5', color: '#065f46' }}
                      onClick={() => handleVote(p.id, 'yes')}>✓ Yes</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }}
                      onClick={() => handleVote(p.id, 'no')}>✕ No</button>
                    <button className="btn btn-sm btn-secondary"
                      onClick={() => handleVote(p.id, 'abstain')}>— Abstain</button>
                  </div>
                )}
                {hasVoted && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ✓ You voted: <strong>{p.votes?.[user!.uid]?.vote}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Proposal">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Title</label>
            <input className="input" value={newProposal.title}
              onChange={e => setNewProposal({...newProposal, title: e.target.value})}
              placeholder="Proposal title" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Type</label>
            <select className="select" value={newProposal.type}
              onChange={e => setNewProposal({...newProposal, type: e.target.value as Proposal['type']})}>
              <option value="budget">Budget</option>
              <option value="policy">Policy</option>
              <option value="case_action">Case Action</option>
              <option value="membership">Membership</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Description</label>
            <textarea className="textarea" value={newProposal.description}
              onChange={e => setNewProposal({...newProposal, description: e.target.value})}
              placeholder="Explain the proposal..." required />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProposalsPage;
