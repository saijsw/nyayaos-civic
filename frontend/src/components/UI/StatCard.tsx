import React from "react";

interface Props {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatCard({ label, value, icon, color }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value" style={{ color: color || "var(--primary)" }}>
            {value}
          </p>
        </div>
        {icon && <span style={{ fontSize: "2rem" }}>{icon}</span>}
      </div>
    </div>
  );
}
