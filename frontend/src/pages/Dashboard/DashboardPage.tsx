import React, { useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { createPool } from "../../services/api";
import StatCard from "../../components/UI/StatCard";
import EmptyState from "../../components/UI/EmptyState";
import type { Pool } from "../../types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [pools, setPools] = React.useState<Pool[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolDesc, setNewPoolDesc] = useState("");
  const [creating, setCreating] = useState(false);

  React.useEffect(() => {
    if (!user?.pools?.length) {
      setLoading(false);
      return;
    }
    // Fetch user's pools
    async function fetchPools() {
      const poolDocs: Pool[] = [];
      // Firestore 'in' query supports up to 30 items
      const chunks = [];
      for (let i = 0; i < user!.pools.length; i += 10) {
        chunks.push(user!.pools.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        const q = query(collection(db, "pools"), where("poolId", "in", chunk));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => poolDocs.push(d.data() as Pool));
      }
      setPools(poolDocs);
      setLoading(false);
    }
    fetchPools();
  }, [user?.pools]);

  async function handleCreatePool() {
    if (!newPoolName.trim()) return;
    setCreating(true);
    try {
      const result = await createPool({
        name: newPoolName,
        description: newPoolDesc,
      });
      alert(`Pool created! ID: ${(result as any).poolId}`);
      setShowCreate(false);
      setNewPoolName("");
      setNewPoolDesc("");
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="text-center mt-3">Loading pools...</div>;

  return (
    <div className="container" style={{ marginTop: "1.5rem" }}>
      <div className="flex items-center justify-between mb-2">
        <h1>My Pools</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Pool
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid-4 mb-2">
        <StatCard label="Total Pools" value={pools.length} icon="🏛️" />
        <StatCard label="Public" value={pools.filter((p) => p.visibility === "public").length} icon="🌐" />
        <StatCard label="Pro Tier" value={pools.filter((p) => p.subscriptionTier === "pro").length} icon="⭐" color="#975a16" />
        <StatCard label="Federations" value={pools.filter((p) => p.subscriptionTier === "federation").length} icon="🤝" color="#276749" />
      </div>

      {/* Pool List */}
      {pools.length === 0 ? (
        <EmptyState
          icon="🏛️"
          title="No Pools Yet"
          description="Create your first legal pool to get started with collective governance."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Create Your First Pool
            </button>
          }
        />
      ) : (
        <div className="grid-2">
          {pools.map((pool) => (
            <Link key={pool.poolId} to={`/pool/${pool.poolId}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}>
                <div className="flex items-center justify-between">
                  <h3>{pool.name}</h3>
                  <span className={`badge badge-${pool.subscriptionTier}`}>
                    {pool.subscriptionTier.toUpperCase()}
                  </span>
                </div>
                <p className="text-muted text-sm mt-1">{pool.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted">
                  <span>👥 {pool.memberCount} members</span>
                  <span>• {pool.visibility}</span>
                  {pool.frozen && <span className="badge badge-rejected">FROZEN</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreate && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 450 }}>
            <h2 className="mb-2">Create New Pool</h2>
            <div className="mb-2">
              <label className="label">Pool Name</label>
              <input className="input" value={newPoolName} onChange={(e) => setNewPoolName(e.target.value)} placeholder="e.g. Tenant Rights Collective" />
            </div>
            <div className="mb-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={newPoolDesc} onChange={(e) => setNewPoolDesc(e.target.value)} placeholder="What is this pool about?" />
            </div>
            <div className="flex gap-1" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreatePool} disabled={creating}>
                {creating ? "Creating..." : "Create Pool"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
