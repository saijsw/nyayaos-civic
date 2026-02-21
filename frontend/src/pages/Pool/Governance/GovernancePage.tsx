import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePool } from "../../../context/PoolContext";
import { updatePool, recalculatePoolReputation } from "../../../services/api";
import FeatureGate from "../../../components/Guards/FeatureGate";

export default function GovernancePage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { pool, isAdmin } = usePool();

  const [threshold, setThreshold] = useState(pool?.governanceSettings?.approvalThreshold || 51);
  const [votingDays, setVotingDays] = useState(pool?.governanceSettings?.votingDurationDays || 7);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updatePool({
        poolId,
        governanceSettings: {
          ...pool?.governanceSettings,
          approvalThreshold: threshold,
          votingDurationDays: votingDays,
        },
      });
      alert("Governance settings updated.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalcReputation() {
    try {
      const result = await recalculatePoolReputation({ poolId });
      alert((result as any).message);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (!isAdmin) return <p>Admin access required.</p>;

  return (
    <div>
      <h2 className="mb-2">Governance Settings</h2>

      <div className="card mb-2">
        <h3 className="mb-1">Voting Rules</h3>
        <div className="grid-2 mb-2">
          <div>
            <label className="label">Approval Threshold (%)</label>
            <input className="input" type="number" min={1} max={100} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
            <p className="text-muted text-sm mt-1">Minimum % of votes needed to pass a proposal.</p>
          </div>
          <div>
            <label className="label">Voting Duration (days)</label>
            <input className="input" type="number" min={1} max={90} value={votingDays} onChange={(e) => setVotingDays(Number(e.target.value))} />
            <p className="text-muted text-sm mt-1">How long proposals stay open for voting.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <FeatureGate feature="reputationWeightedVoting">
        <div className="card mb-2">
          <h3 className="mb-1">⭐ Reputation Engine</h3>
          <p className="text-sm text-muted mb-2">
            Reputation scores are calculated using: (Contributions × 0.4) + (Voting Participation × 0.3) + (Proposal Accuracy × 0.3)
          </p>
          <button className="btn btn-accent" onClick={handleRecalcReputation}>
            🔄 Recalculate All Reputation Scores
          </button>
        </div>
      </FeatureGate>

      <div className="card">
        <h3 className="mb-1">Pool Info</h3>
        <div className="grid-2">
          <div>
            <p className="text-sm text-muted">Subscription Tier</p>
            <p className="font-bold">{pool?.subscriptionTier?.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Visibility</p>
            <p className="font-bold">{pool?.visibility}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Transparency</p>
            <p className="font-bold">{pool?.transparencyEnabled ? "Enabled" : "Disabled"}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Status</p>
            <p className="font-bold">{pool?.frozen ? "🔒 Frozen" : "✅ Active"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
