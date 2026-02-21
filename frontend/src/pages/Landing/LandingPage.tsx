import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "80vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, var(--primary) 0%, #2b6cb0 100%)",
        color: "white", padding: "5rem 2rem", textAlign: "center",
      }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "1rem" }}>
          ⚖️ NyayaOS Civic
        </h1>
        <p style={{ fontSize: "1.25rem", opacity: 0.9, maxWidth: 700, margin: "0 auto 2rem" }}>
          Open-core civic infrastructure for democratic governance, transparent treasury management,
          and collective legal action.
        </p>
        <div className="flex items-center gap-2" style={{ justifyContent: "center" }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-accent" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-accent" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "1rem", color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container" style={{ padding: "4rem 1rem" }}>
        <h2 className="text-center mb-2" style={{ fontSize: "2rem" }}>Platform Features</h2>
        <div className="grid-3" style={{ marginTop: "2rem" }}>
          {[
            { icon: "🏛️", title: "Legal Pools", desc: "Create and manage legal pools with democratic governance and transparent decision-making." },
            { icon: "📜", title: "Proposals & Voting", desc: "Submit proposals, cast votes, and track outcomes. Pro tier unlocks reputation-weighted voting." },
            { icon: "💰", title: "Treasury Management", desc: "Immutable financial ledger with contribution tracking, expense recording, and real-time balances." },
            { icon: "⚖️", title: "Case Tracking", desc: "Track legal cases with stage-based progress, cost projections, and timeline management." },
            { icon: "🤝", title: "Federation", desc: "Form cross-pool alliances, share war chests, and coordinate joint legal action." },
            { icon: "🔍", title: "Public Transparency", desc: "Auto-generated public pages showing treasury, proposals, and case progress." },
          ].map((f, i) => (
            <div key={i} className="card">
              <p style={{ fontSize: "2rem" }}>{f.icon}</p>
              <h3 className="mt-1">{f.title}</h3>
              <p className="text-muted text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section style={{ background: "#edf2f7", padding: "4rem 1rem" }}>
        <div className="container">
          <h2 className="text-center mb-2" style={{ fontSize: "2rem" }}>Subscription Tiers</h2>
          <div className="grid-3" style={{ marginTop: "2rem" }}>
            {[
              { tier: "Free", price: "₹0", color: "#2b6cb0", features: ["Treasury Ledger", "Proposals & Equal Voting", "Case Tracking", "Public Transparency", "Audit Logs"] },
              { tier: "Pro", price: "₹999/mo", color: "#975a16", features: ["Everything in Free +", "Reputation-weighted Voting", "Advanced Analytics", "Cost Projection", "Private Pools", "Custom Governance", "Data Export"] },
              { tier: "Federation", price: "₹4,999/mo", color: "#276749", features: ["Everything in Pro +", "Cross-pool Alliances", "Shared War Chest", "Inter-pool Voting", "Federation Analytics"] },
            ].map((t, i) => (
              <div key={i} className="card" style={{ textAlign: "center", borderTop: `3px solid ${t.color}` }}>
                <h3 style={{ color: t.color }}>{t.tier}</h3>
                <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0" }}>{t.price}</p>
                <ul style={{ listStyle: "none", textAlign: "left", fontSize: "0.9rem" }}>
                  {t.features.map((f, j) => (
                    <li key={j} style={{ padding: "0.3rem 0", borderBottom: "1px solid var(--border)" }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
