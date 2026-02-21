import React from "react";

interface Props {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="card text-center" style={{ padding: "3rem" }}>
      <p style={{ fontSize: "3rem" }}>{icon}</p>
      <h3 className="mt-1">{title}</h3>
      <p className="text-muted mt-1">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
