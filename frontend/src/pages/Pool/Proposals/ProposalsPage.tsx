import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePool } from "../../../context/PoolContext";
import { usePoolProposals } from "../../../hooks/usePoolData";
import { createProposal, castVote, closeProposal } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import EmptyState from "../../../components/UI/EmptyState";

export default function ProposalsPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { user } = useAuth();
  const { isAdmin } = usePool();
  const { data: proposals, loading } = usePoolProposals(poolId!);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProposal({ poolId, title, description });
      setShowCreate(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(proposalId: string, vote: string) {
    try {
      await castVote({ poolId, proposalId, vote });
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleClose(proposalId: string) {
    if (!confirm("Close this proposal? This action cannot be undone.")) return;
    try {
      const result = await closeProposal({ poolId, proposalId });
      alert(`Proposal ${(result as any).status}. Approval: ${(result as any).approvalPercent?.toFixed(1)}%`);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading proposals...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2>Proposals</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <EmptyState icon="📜" title="No Proposals" description="Create the first proposal to start democratic decision-making." />
      ) : (
        <div className="flex-col gap-2">
          {proposals.map((p) => (
            <div key={p.proposalId} className="card">
              <div className="flex items-center justify-between">
                <h3>{p.title}</h3>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
              <p className="text-muted text-sm mt-1">{p.description}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span style={{ color: "var(--accent)" }}>👍 {p.votesFor} For</span>
                <span style={{ color: "var(--danger)" }}>👎 {p.votesAgainst} Against</span>
                <span className="text-muted">/ {p.totalEligibleVoters} eligible</span>
              </div>
              {p.status === "active" && (
                <div className="flex gap-1 mt-2">
                  <button className="btn btn-accent" onClick={() => handleVote(p.proposalId, "for")}>
                    Vote For
                  </button>
                  <button className="btn btn-danger" onClick={() => handleVote(p.proposalId, "against")}>
                    Vote Against
                  </button>
                  {isAdmin && (
                    <button className="btn btn-outline" onClick={() => handleClose(p.proposalId)}>
                      Close Proposal
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 500 }}>
            <h2 className="mb-2">New Proposal</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-2">
                <label className="label">Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className="label">Description</label>
                <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="flex gap-1" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Submit Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
