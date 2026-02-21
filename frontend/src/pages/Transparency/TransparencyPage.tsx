import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import StatCard from "../../components/UI/StatCard";

export default function TransparencyPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "transparency", poolId!));
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    }
    load();
  }, [poolId]);

  if (loading) return <div className="text-center mt-3">Loading transparency data...</div>;
  if (!data) return <div className="container mt-3"><h2>No transparency data available for this pool.</h2></div>;

  return (
    <div className="container" style={{ marginTop: "2rem", maxWidth: 900 }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1>🔍 Public Transparency Report</h1>
        <h2 style={{ color: "var(--primary-light)" }}>{data.poolName}</h2>
        <p className="text-muted">Last updated: {data.lastSyncedAt?.toDate?.()?.toLocaleDateString() || "N/A"}</p>
      </div>

      <div className="grid-3 mb-2">
        <StatCard label="Members" value={data.memberCount || 0} icon="👥" />
        <StatCard label="Treasury Balance" value={`₹${(data.treasuryBalance || 0).toLocaleString()}`} icon="💰" color="var(--accent)" />
        <StatCard label="Total Proposals" value={data.proposalSummary?.length || 0} icon="📜" />
      </div>

      <div className="card mb-2">
        <h3 className="mb-1">Proposal History</h3>
        {data.proposalSummary?.length === 0 ? <p className="text-muted">No proposals.</p> : (
          <table>
            <thead><tr><th>Title</th><th>Status</th><th>For</th><th>Against</th></tr></thead>
            <tbody>
              {data.proposalSummary?.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.title}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td>{p.votesFor}</td>
                  <td>{p.votesAgainst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="mb-1">Case Tracker</h3>
        {data.caseSummary?.length === 0 ? <p className="text-muted">No cases.</p> : (
          data.caseSummary?.map((c: any, i: number) => (
            <div key={i} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <strong>{c.title}</strong>
                <span className="badge badge-active">{c.status}</span>
              </div>
              {c.stages?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {c.stages.map((s: any, j: number) => (
                    <span key={j} style={{
                      padding: "0.2rem 0.5rem", borderRadius: "var(--radius)", fontSize: "0.75rem",
                      background: s.status === "completed" ? "#c6f6d5" : s.status === "current" ? "#bee3f8" : "#e2e8f0",
                    }}>{s.stageName}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
