import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { getFederationOverview } from "../../services/api";
import EmptyState from "../../components/UI/EmptyState";
import StatCard from "../../components/UI/StatCard";

export default function FederationPage() {
  const { user } = useAuth();
  const [federations, setFederations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "federationGroups"));
      setFederations(snap.docs.map((d) => d.data()));
      setLoading(false);
    }
    load();
  }, []);

  async function viewFederation(federationId: string) {
    try {
      const data = await getFederationOverview({ federationId });
      setSelected(data);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading federations...</div>;

  return (
    <div className="container" style={{ marginTop: "1.5rem" }}>
      <h1 className="mb-2">🤝 Federations</h1>

      {federations.length === 0 ? (
        <EmptyState icon="🤝" title="No Federations" description="No federation groups have been created yet." />
      ) : (
        <div className="grid-2 mb-2">
          {federations.map((f) => (
            <div key={f.federationId} className="card" style={{ cursor: "pointer" }} onClick={() => viewFederation(f.federationId)}>
              <h3>{f.title}</h3>
              <p className="text-muted text-sm">{f.description}</p>
              <div className="flex gap-2 mt-2 text-sm">
                <span>🏛️ {f.memberPools?.length || 0} pools</span>
                <span>💰 ₹{(f.sharedTreasuryBalance || 0).toLocaleString()}</span>
                <span>📊 {f.governanceModel}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card mt-2">
          <h2>{(selected as any).federation?.title}</h2>
          <div className="grid-3 mt-2 mb-2">
            <StatCard label="Member Pools" value={(selected as any).federation?.memberPoolCount} icon="🏛️" />
            <StatCard label="War Chest" value={`₹${((selected as any).federation?.sharedTreasuryBalance || 0).toLocaleString()}`} icon="💰" color="var(--accent)" />
            <StatCard label="Governance" value={(selected as any).federation?.governanceModel} icon="📊" />
          </div>

          <h3 className="mb-1">Member Pools</h3>
          <div className="grid-2 mb-2">
            {((selected as any).memberPools || []).map((p: any) => (
              <div key={p.poolId} className="card">
                <strong>{p.name}</strong>
                <span className="text-muted text-sm"> — {p.memberCount} members</span>
              </div>
            ))}
          </div>

          <h3 className="mb-1">Recent Ledger</h3>
          <table>
            <thead><tr><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
            <tbody>
              {((selected as any).recentLedger || []).map((e: any, i: number) => (
                <tr key={i}>
                  <td><span className="badge badge-active">{e.type}</span></td>
                  <td>₹{e.amount?.toLocaleString()}</td>
                  <td>{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
