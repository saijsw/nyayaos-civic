import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)',
        color: 'white', padding: '80px 24px', textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            Collective Justice,<br />Transparent Governance
          </h1>
          <p style={{ fontSize: 20, opacity: 0.9, maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            NyayaOS Civic empowers communities to pool resources, govern transparently,
            and pursue justice collectively through democratic decision-making.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)' }}>
              Get Started Free
            </Link>
            <Link to="/transparency" className="btn btn-lg" style={{
              background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.4)'
            }}>
              View Public Pools
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 48 }}>
            Built for Civic Power
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section style={{ padding: '80px 24px', background: 'var(--primary-bg)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 48 }}>
            Choose Your Plan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {tiers.map((t, i) => (
              <div key={i} className="card" style={{
                textAlign: 'center',
                border: t.highlight ? '2px solid var(--primary)' : undefined,
                position: 'relative',
              }}>
                {t.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--primary)', color: 'white', padding: '4px 16px',
                    borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700,
                  }}>
                    POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t.name}</h3>
                <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', marginBottom: 16 }}>{t.price}</p>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {t.features.map((feat, j) => (
                    <li key={j} style={{ padding: '6px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                      ✓ {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`btn btn-lg ${t.highlight ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%' }}>
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 24px', textAlign: 'center',
        borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14,
      }}>
        <p>© 2026 NyayaOS Civic. Built for communities. Open-core governance infrastructure.</p>
      </footer>
    </div>
  );
};

const features = [
  { icon: '💰', title: 'Transparent Treasury', desc: 'Immutable ledger tracks every contribution and expense with full audit trail.' },
  { icon: '🗳️', title: 'Democratic Governance', desc: 'Propose, debate, and vote on pool decisions with configurable thresholds.' },
  { icon: '⚖️', title: 'Case Tracking', desc: 'Track legal cases from filing to judgment with cost projection engine.' },
  { icon: '⭐', title: 'Reputation System', desc: 'Weighted voting based on contribution, participation, and proposal accuracy.' },
  { icon: '🏛️', title: 'Federation Alliance', desc: 'Unite pools into federations with shared war chest and joint governance.' },
  { icon: '🔍', title: 'Civic Transparency', desc: 'Public dashboard shows treasury, proposals, and case progress for public pools.' },
];

const tiers = [
  {
    name: 'Free', price: '₹0', highlight: false, cta: 'Start Free',
    features: ['Treasury Ledger', 'Proposals & Voting', 'Case Tracking', 'Public Transparency', 'Audit Logs'],
  },
  {
    name: 'Pro', price: '₹999/mo', highlight: true, cta: 'Upgrade to Pro',
    features: ['Everything in Free', 'Reputation Voting', 'Advanced Analytics', 'Cost Projection', 'Private Pools', 'Data Export'],
  },
  {
    name: 'Federation', price: '₹2,499/mo', highlight: false, cta: 'Go Federation',
    features: ['Everything in Pro', 'Cross-Pool Alliances', 'Shared War Chest', 'Inter-Pool Voting', 'Federation Analytics'],
  },
];

export default LandingPage;
