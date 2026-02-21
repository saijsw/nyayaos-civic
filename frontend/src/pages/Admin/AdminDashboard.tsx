import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGlobalAnalytics } from "../../services/api";
import StatCard from "../../components/UI/StatCard";
import LoadingSpinner from "../../components/UI/LoadingSpinner";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGlobalAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  return (
    <div className="container" style={{ marginTop: "1.5rem" }}>
      <h1 className="mb-2">🛡️ Super Admin Dashboard</h1>

      {analytics && (
        <>
          <div className="grid-4 mb-2">
            <StatCard label="Total Users" value={analytics.totalUsers} icon="👤" />
            <StatCard label="Total Pools" value={analytics.totalPools} icon="🏛️" />
            <StatCard label="Federations" value={analytics.totalFederations} icon="🤝" />
            <StatCard label="Frozen Pools" value={analytics.frozenPools} icon="🔒" color="var(--danger)" />
          </div>

          <div className="grid-3 mb-2">
            <div className="card">
              <h3>Tier Distribution</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span>Free</span>
                  <strong>{analytics.tierBreakdown?.free || 0}</strong>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span>Pro</span>
                  <strong style={{ color: "#975a16" }}>{analytics.tierBreakdown?.pro || 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Federation</span>
                  <strong style={{ color: "#276749" }}>{analytics.tierBreakdown?.federation || 0}</strong>
                </div>
              </div>
            </div>
            <div className="card">
              <h3>Quick Actions</h3>
              <div className="flex-col gap-1 mt-2">
                <Link to="/admin/pools" className="btn btn-outline" style={{ width: "100%" }}>Manage Pools</Link>
                <Link to="/admin/users" className="btn btn-outline" style={{ width: "100%" }}>Manage Users</Link>
                <Link to="/admin/federation" className="btn btn-outline" style={{ width: "100%" }}>Federations</Link>
              </div>
            </div>
            <div className="card">
              <h3>Platform Health</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span>Public Pools</span>
                  <strong>{analytics.publicPools || 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Pools</span>
                  <strong style={{ color: "var(--accent)" }}>{(analytics.totalPools || 0) - (analytics.frozenPools || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
