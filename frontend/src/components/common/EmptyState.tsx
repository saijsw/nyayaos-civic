import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, description, action }) => (
  <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <h3 style={{ marginBottom: 8, fontSize: 18 }}>{title}</h3>
    {description && (
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
        {description}
      </p>
    )}
    {action}
  </div>
);

export default EmptyState;
