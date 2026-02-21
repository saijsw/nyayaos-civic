import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTreasuryLedger, getTreasurySummary, recordContribution, recordExpense, TreasuryEntry, TreasurySummary } from 'services/treasuryService';
import { useNotifications } from 'context/NotificationContext';
import StatusBadge from 'components/common/StatusBadge';
import Modal from 'components/common/Modal';
import LoadingSpinner from 'components/common/LoadingSpinner';
import EmptyState from 'components/common/EmptyState';
import { formatCurrency, formatDateTime } from 'utils/formatters';

const TreasuryPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { addNotification } = useNotifications();
  const [ledger, setLedger] = useState<TreasuryEntry[]>([]);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'contribution' | 'expense'>('contribution');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!poolId) return;
    try {
      const [l, s] = await Promise.all([getTreasuryLedger(poolId), getTreasurySummary(poolId)]);
      setLedger(l);
      setSummary(s);
    } catch (err) {
      addNotification('error', 'Failed to load treasury');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [poolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolId) return;
    setSubmitting(true);
    try {
      const data = { poolId, amount: parseFloat(amount), description };
      if (addType === 'contribution') await recordContribution(data);
      else await recordExpense(data);
      addNotification('success', `${addType === 'contribution' ? 'Contribution' : 'Expense'} recorded!`);
      setShowAdd(false);
      setAmount('');
      setDescription('');
      load();
    } catch (err: any) {
      addNotification('error', err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>💰 Treasury</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => { setAddType('contribution'); setShowAdd(true); }}>
            + Contribution
          </button>
          <button className="btn btn-secondary" onClick={() => { setAddType('expense'); setShowAdd(true); }}>
            + Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(summary.totalContributions)}</div>
            <div className="stat-label">Total Contributions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(summary.totalExpenses)}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(summary.balance)}</div>
            <div className="stat-label">Current Balance</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(summary.pendingExpenses)}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {ledger.length === 0 ? (
        <EmptyState icon="💰" title="No transactions yet" description="Record the first contribution to start the treasury." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 13 }}>{formatDateTime(entry.createdAt)}</td>
                  <td>
                    <span className={`badge ${entry.type === 'contribution' ? 'badge-success' : entry.type === 'expense' ? 'badge-danger' : 'badge-info'}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 14 }}>{entry.description}</td>
                  <td style={{
                    textAlign: 'right', fontWeight: 700, fontSize: 14,
                    color: entry.type === 'contribution' ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {entry.type === 'contribution' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </td>
                  <td><StatusBadge status={entry.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title={addType === 'contribution' ? 'Record Contribution' : 'Record Expense'}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Amount (INR)</label>
            <input className="input" type="number" min="1" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Description</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What is this for?" required />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TreasuryPage;
