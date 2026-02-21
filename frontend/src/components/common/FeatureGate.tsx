import React, { ReactNode } from 'react';
import { useFeatureFlag, useCurrentTier } from 'hooks/useFeatureFlag';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Only renders children if the feature is enabled for current pool's tier */
const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
  const isEnabled = useFeatureFlag(feature);
  const tier = useCurrentTier();

  if (isEnabled) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h3 style={{ marginBottom: 8 }}>Feature Locked</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        This feature requires a higher subscription tier.
        You're currently on the <strong>{tier}</strong> plan.
      </p>
      <button className="btn btn-primary">Upgrade Plan</button>
    </div>
  );
};

export default FeatureGate;
