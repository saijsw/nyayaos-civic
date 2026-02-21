import React from "react";
import { useParams } from "react-router-dom";
import { usePoolCases } from "../../../hooks/usePoolData";
import { usePool } from "../../../context/PoolContext";
import EmptyState from "../../../components/UI/EmptyState";

export default function CasesPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: cases, loading } = usePoolCases(poolId!);
  const { isAdmin } = usePool();

  if (loading) return <div>Loading cases...</div>;

  const statusColors: Record<string, string> = {
    filed: "#2b6cb0",
    in_progress: "#dd6b20",
    hearing: "#d69e2e",
    resolved: "#38a169",
    closed: "#718096",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2>Cases</h2>
        {isAdmin && <button className="btn btn-primary">+ New Case</button>}
      </div>

      {cases.length === 0 ? (
        <EmptyState icon="⚖️" title="No Cases" description="No legal cases have been filed yet." />
      ) : (
        <div className="flex-col gap-2">
          {cases.map((c) => (
            <div key={c.caseId} className="card">
              <div className="flex items-center justify-between">
                <h3>{c.title}</h3>
                <span className="badge" style={{ background: `${statusColors[c.status]}20`, color: statusColors[c.status] }}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-muted text-sm mt-1">{c.description}</p>
              <div className="flex gap-2 mt-2 text-sm text-muted">
                <span>📋 {c.caseType}</span>
                <span>🏛️ {c.courtLevel}</span>
                {c.projectedCost && <span>💰 Projected: ₹{c.projectedCost.toLocaleString()}</span>}
              </div>
              {/* Case Stage Tracker */}
              {c.stages && c.stages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-bold mb-1">Case Progress:</p>
                  <div className="flex gap-1">
                    {c.stages.map((stage, i) => (
                      <div key={i} style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8rem",
                        background: stage.status === "completed" ? "#c6f6d5" : stage.status === "current" ? "#bee3f8" : "#e2e8f0",
                        color: stage.status === "completed" ? "#276749" : stage.status === "current" ? "#2a4365" : "#4a5568",
                        fontWeight: stage.status === "current" ? 600 : 400,
                      }}>
                        {stage.stageName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
