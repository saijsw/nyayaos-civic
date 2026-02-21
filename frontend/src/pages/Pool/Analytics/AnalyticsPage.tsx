import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPoolAnalytics } from "../../../services/api";
import FeatureGate from "../../../components/Guards/FeatureGate";
import StatCard from "../../../components/UI/StatCard";
import LoadingSpinner from "../../../components/UI/LoadingSpinner";

export default function AnalyticsPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPoolAnalytics({ poolId });
        setAnalytics(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [poolId]);

  return (
    <FeatureGate feature="advancedAnalytics">
      <div>
        <h2 className="mb-2">📈 Advanced Analytics</h2>
        {loading || !analytics ? <LoadingSpinner /> : (
          <>
            <div className="grid-4 mb-2">
              <StatCard label="Total Members" value={analytics.memberCount} icon="👥" />
              <StatCard label="Total Proposals" value={analytics.proposalStats.total} icon="📜" />
              <StatCard label="Active Cases" value={analytics.caseStats.active} icon="⚖️" />
              <StatCard label="Treasury Balance" value={`₹${analytics.treasury.currentBalance.toLocaleString()}`} icon="💰" color="var(--accent)" />
            </div>

            <div className="grid-2 mb-2">
              <div className="card">
                <h3 className="mb-1">Proposal Breakdown</h3>
                <div className="grid-2">
                  <div><span className="text-muted text-sm">Active:</span> <strong>{analytics.proposalStats.active}</strong></div>
                  <div><span className="text-muted text-sm">Passed:</span> <strong>{analytics.proposalStats.passed}</strong></div>
                  <div><span className="text-muted text-sm">Rejected:</span> <strong>{analytics.proposalStats.rejected}</strong></div>
                  <div><span className="text-muted text-sm">Expired:</span> <strong>{analytics.proposalStats.expired}</strong></div>
                </div>
              </div>
              <div className="card">
                <h3 className="mb-1">Treasury Summary</h3>
                <div className="grid-2">
                  <div><span className="text-muted text-sm">Total In:</span> <strong style={{ color: "var(--accent)" }}>₹{analytics.treasury.totalContributions.toLocaleString()}</strong></div>
                  <div><span className="text-muted text-sm">Total Out:</span> <strong style={{ color: "var(--danger)" }}>₹{analytics.treasury.totalExpenses.toLocaleString()}</strong></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
