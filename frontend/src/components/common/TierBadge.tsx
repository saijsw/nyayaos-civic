import React from 'react';
import { getTierColor } from 'utils/formatters';

interface TierBadgeProps {
  tier: 'free' | 'pro' | 'federation';
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
  const color = getTierColor(tier);
  return (
    <span
      className="badge"
      style={{ background: color + '20', color, border: `1px solid ${color}40` }}
    >
      {tier}
    </span>
  );
};

export default TierBadge;
