import React from 'react';
import { getStatusColor } from 'utils/formatters';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const color = getStatusColor(status);
  const bg = color + '20'; // 12% opacity

  return (
    <span
      className="badge"
      style={{
        background: bg,
        color,
        fontSize: size === 'sm' ? 10 : 11,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
