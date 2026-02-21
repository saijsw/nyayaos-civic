import React from "react";
import { usePool } from "../../context/PoolContext";
import { usePoolProposals, usePoolTreasury, usePoolCases, usePoolMembers } from "../../hooks/usePoolData";
import { useParams } from "react-router-dom";
import StatCard from "../../components/UI/StatCard";
import LoadingSpinner from "../../components/UI/LoadingSpinner";

export default function PoolOverview() {
  const { poolId } = useParams<{ poolId: string }>();
  const { pool } = usePool();
  const { data: proposals } = usePoolProposals(poolId!);
  const { data: treasury } = usePoolTreasury(poolId!);
  const { data: cases } = usePoolCases(poolId!);
  const { data: members } = usePoolMembers(poolId!);

  if (!pool) return <LoadingSpinner />;

  const activeProposals = proposals.filter((p) => p.status === "active").length;
  const currentBalance = treasury.length > 0 ? treasury[0].balanceAfter : 0;
  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status)).length;

  return (
    <div>
      <h1 className="mb-2">{pool.name}</h1>
      <p className="text-muted mb-2">{pool.description}</p>

      <div className="grid-4 mb-2">
        <StatCard label="Members" value={members.length} icon="👥" />
        <StatCard label="Active Proposals" value={activeProposals} icon="📜" />
        <StatCard label="Treasury Balance" value={`₹${currentBalance.toLocaleString()}`} icon="💰" color="var(--accent)" />
        <StatCard label="Active Cases" value={activeCases} icon="⚖️" />
      </div>

      {/* Recent Proposals */}
      <div className="card mb-2">
        <h3 className="mb-1">Recent Proposals</h3>
        {proposals.slice(0, 5).length === 0 ? (
          <p className="text-muted text-sm">No proposals yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Status</th><th>Votes For</th><th>Votes Against</th></tr>
            </thead>
            <tbody>
              {proposals.slice(0, 5).map((p) => (
                <tr key={p.proposalId}>
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

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="mb-1">Recent Treasury Activity</h3>
        {treasury.slice(0, 5).length === 0 ? (
          <p className="text-muted text-sm">No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr>
            </thead>
            <tbody>
              {treasury.slice(0, 5).map((tx) => (
                <tr key={tx.txId}>
                  <td><span className={`badge ${tx.type === "contribution" ? "badge-active" : "badge-rejected"}`}>{tx.type}</span></td>
                  <td style={{ color: tx.amount >= 0 ? "var(--accent)" : "var(--danger)" }}>
                    {tx.amount >= 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                  </td>
                  <td>{tx.description}</td>
                  <td>₹{tx.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
