import {
  collection, getDocs, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface AdminStats {
  totalPools: number;
  totalUsers: number;
  activeProposals: number;
  totalTreasuryVolume: number;
  activeFederations: number;
  frozenPools: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

/** Get global admin stats */
export const getAdminStats = async (): Promise<AdminStats> => {
  const fn = httpsCallable<void, AdminStats>(functions, 'getAdminStats');
  const result = await fn();
  return result.data;
};

/** Freeze/unfreeze a pool */
export const togglePoolFreeze = async (poolId: string, freeze: boolean) => {
  const fn = httpsCallable(functions, 'togglePoolFreeze');
  return fn({ poolId, freeze });
};

/** Approve tier upgrade */
export const approveTierUpgrade = async (poolId: string, newTier: 'pro' | 'federation') => {
  const fn = httpsCallable(functions, 'approveTierUpgrade');
  return fn({ poolId, newTier });
};

/** Get audit logs */
export const getAuditLogs = async (maxResults = 100): Promise<AuditLogEntry[]> => {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
};

/** Get pool audit logs */
export const getPoolAuditLogs = async (poolId: string, maxResults = 50): Promise<AuditLogEntry[]> => {
  const q = query(
    collection(db, 'auditLogs'),
    where('targetId', '==', poolId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
};

/** Manage user roles */
export const updateUserRole = async (userId: string, role: 'member' | 'admin' | 'superAdmin') => {
  const fn = httpsCallable(functions, 'updateUserRole');
  return fn({ userId, role });
};
