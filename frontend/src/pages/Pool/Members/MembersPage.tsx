import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePoolMembers } from "../../../hooks/usePoolData";
import { usePool } from "../../../context/PoolContext";
import { addMember, removeMember } from "../../../services/api";

export default function MembersPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: members, loading } = usePoolMembers(poolId!);
  const { isAdmin, featureFlags } = usePool();
  const [addUid, setAddUid] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!addUid.trim()) return;
    setAdding(true);
    try {
      await addMember({ poolId, targetUid: addUid });
      setAddUid("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(targetUid: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember({ poolId, targetUid });
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading members...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2>Members ({members.length})</h2>
        {isAdmin && (
          <div className="flex gap-1">
            <input className="input" style={{ width: 250 }} placeholder="User ID to add" value={addUid} onChange={(e) => setAddUid(e.target.value)} />
            <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
              {adding ? "Adding..." : "Add Member"}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Role</th>
              {featureFlags?.reputationWeightedVoting && <th>Reputation</th>}
              <th>Contributions</th>
              <th>Votes Cast</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.memberId}>
                <td className="text-sm">{m.uid}</td>
                <td>
                  <span className={`badge ${m.role === "owner" ? "badge-federation" : m.role === "admin" ? "badge-pro" : "badge-free"}`}>
                    {m.role}
                  </span>
                </td>
                {featureFlags?.reputationWeightedVoting && (
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                        <div style={{ width: `${m.reputationScore || 0}%`, height: "100%", background: "var(--accent)", borderRadius: 3 }} />
                      </div>
                      <span className="text-sm">{m.reputationScore || 0}</span>
                    </div>
                  </td>
                )}
                <td>{(m as any).contributionScore || 0}</td>
                <td>{(m as any).votingParticipation || 0}</td>
                {isAdmin && (
                  <td>
                    {m.role !== "owner" && (
                      <button className="btn btn-danger" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }} onClick={() => handleRemove(m.uid)}>
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
