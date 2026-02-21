import React from "react";
import { usePool } from "../../context/PoolContext";
import type { FeatureFlags } from "../../types";

interface Props {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Feature Gate — conditionally renders children based on pool tier.
 */
export default function FeatureGate({ feature, children, fallback }: Props) {
  const { featureFlags } = usePool();

  if (!featureFlags || !featureFlags[feature]) {
    return fallback ? <>{fallback}</> : (
      <div className="card text-center" style={{ padding: "2rem" }}>
        <p style={{ fontSize: "1.5rem" }}>🔒</p>
        <p className="font-bold">Premium Feature</p>
        <p className="text-muted text-sm mt-1">
          Upgrade your pool to access this feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
