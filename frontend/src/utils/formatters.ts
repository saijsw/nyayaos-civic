import { Timestamp } from 'firebase/firestore';

/** Format currency */
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Format Firestore timestamp to readable date */
export const formatDate = (ts: Timestamp | Date | null): string => {
  if (!ts) return 'N/A';
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/** Format timestamp with time */
export const formatDateTime = (ts: Timestamp | Date | null): string => {
  if (!ts) return 'N/A';
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/** Format percentage */
export const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

/** Truncate long text */
export const truncate = (str: string, maxLen = 100): string =>
  str.length > maxLen ? str.slice(0, maxLen) + '...' : str;

/** Generate initials from name */
export const getInitials = (name: string): string =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

/** Status color mapping */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#10b981',
    passed: '#10b981',
    approved: '#10b981',
    pending: '#f59e0b',
    filing: '#f59e0b',
    discovery: '#3b82f6',
    hearing: '#8b5cf6',
    rejected: '#ef4444',
    expired: '#6b7280',
    frozen: '#ef4444',
    closed: '#6b7280',
    judgment: '#10b981',
    appeal: '#f59e0b',
  };
  return colors[status] || '#6b7280';
};

/** Tier badge color */
export const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    free: '#6b7280',
    pro: '#8b5cf6',
    federation: '#f59e0b',
  };
  return colors[tier] || '#6b7280';
};
