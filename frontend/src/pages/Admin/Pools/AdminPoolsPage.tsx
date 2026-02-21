import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { freezePool, unfreezePool, upgradePoolTier } from "../../../services/api";
import type { Pool, SubscriptionTier } from "../../../types";

export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "pools"));
      setPools(snap.docs.map((d) => d.data() as Pool));
      setLoading(false);
    }
    load();
  }, []);

  async function handleFreeze(poolId: string, frozen: boolean) {
    try {
      if (frozen) {
        await unfreezePool({ poolId });
      } else {
        await freezePool({ poolId });
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleUpgrade(poolId: string, newTier: SubscriptionTier) {
    try {
      await upgradePoolTier({ poolId, newTier });
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading pools...</div>;

  return (
    <div className="container" style={{ marginTop: "1.5rem" }}>
      <h2 className="mb-2">Manage Pools ({pools.length})</h2>
      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Tier</th><th>Members</th><th>Visibility</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pools.map((p) => (
              <tr key={p.poolId}>
                <td><strong>{p.name}</strong></td>
                <td><span className={`badge badge-${p.subscriptionTier}`}>{p.subscriptionTier}</span></td>
                <td>{p.memberCount}</td>
                <td>{p.visibility}</td>
                <td>{p.frozen ? "🔒 Frozen" : "✅ Active"}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className={`btn ${p.frozen ? "btn-accent" : "btn-danger"}`}
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
                      onClick={() => handleFreeze(p.poolId, p.frozen)}
                    >
                      {p.frozen ? "Unfreeze" : "Freeze"}
                    </button>
                    <select
                      style={{ fontSize: "0.8rem", padding: "0.2rem" }}
                      value={p.subscriptionTier}
                      onChange={(e) => handleUpgrade(p.poolId, e.target.value as SubscriptionTier)}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="federation">Federation</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
