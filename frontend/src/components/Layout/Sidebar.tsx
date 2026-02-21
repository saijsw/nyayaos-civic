import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { usePool } from "../../context/PoolContext";

export default function Sidebar() {
  const { poolId } = useParams<{ poolId: string }>();
  const { pool, isAdmin, featureFlags } = usePool();

  if (!pool) return null;

  const links = [
    { to: `/pool/${poolId}`, label: "📊 Overview", end: true },
    { to: `/pool/${poolId}/proposals`, label: "📜 Proposals" },
    { to: `/pool/${poolId}/treasury`, label: "💰 Treasury" },
    { to: `/pool/${poolId}/cases`, label: "⚖️ Cases" },
    { to: `/pool/${poolId}/members`, label: "👥 Members" },
  ];

  if (isAdmin) {
    links.push({ to: `/pool/${poolId}/governance`, label: "⚙️ Governance" });
  }

  if (featureFlags?.advancedAnalytics) {
    links.push({ to: `/pool/${poolId}/analytics`, label: "📈 Analytics" });
  }

  return (
    <aside className="sidebar">
      <div style={{ padding: "0.5rem 1.25rem", marginBottom: "0.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem" }}>{pool.name}</div>
        <span className={`badge badge-${pool.subscriptionTier}`}>
          {pool.subscriptionTier.toUpperCase()}
        </span>
      </div>
      <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "0.5rem 0" }} />
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={"end" in link}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}
