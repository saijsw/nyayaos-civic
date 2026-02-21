import React from "react";

export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="text-center" style={{ padding: "3rem" }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--border)",
        borderTopColor: "var(--primary)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
      }} />
      <p className="text-muted">{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
