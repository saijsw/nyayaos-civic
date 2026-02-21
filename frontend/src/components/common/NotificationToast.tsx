import React from 'react';
import { useNotifications } from 'context/NotificationContext';

const typeStyles: Record<string, { bg: string; color: string; icon: string }> = {
  success: { bg: '#d1fae5', color: '#065f46', icon: '✓' },
  error: { bg: '#fee2e2', color: '#991b1b', icon: '✕' },
  warning: { bg: '#fef3c7', color: '#92400e', icon: '⚠' },
  info: { bg: '#dbeafe', color: '#1e40af', icon: 'ℹ' },
};

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 2000,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380,
    }}>
      {notifications.map(n => {
        const style = typeStyles[n.type] || typeStyles.info;
        return (
          <div
            key={n.id}
            className="fade-in"
            style={{
              background: style.bg, color: style.color,
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: 'var(--shadow-md)', fontSize: 14, fontWeight: 500,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16 }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              style={{ background: 'none', border: 'none', color: style.color, fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
