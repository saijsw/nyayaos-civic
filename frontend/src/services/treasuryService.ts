import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface TreasuryEntry {
  id: string;
  poolId: string;
  type: 'contribution' | 'expense' | 'refund';
  amount: number;
  currency: string;
  description: string;
  createdBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export interface TreasurySummary {
  totalContributions: number;
  totalExpenses: number;
  balance: number;
  pendingExpenses: number;
  entryCount: number;
}

/** Record a contribution */
export const recordContribution = async (data: {
  poolId: string;
  amount: number;
  currency?: string;
  description: string;
}) => {
  const fn = httpsCallable(functions, 'recordContribution');
  return fn(data);
};

/** Record an expense request */
export const recordExpense = async (data: {
  poolId: string;
  amount: number;
  currency?: string;
  description: string;
}) => {
  const fn = httpsCallable(functions, 'recordExpense');
  return fn(data);
};

/** Get treasury ledger for a pool */
export const getTreasuryLedger = async (
  poolId: string,
  maxResults = 50
): Promise<TreasuryEntry[]> => {
  const q = query(
    collection(db, 'treasury'),
    where('poolId', '==', poolId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TreasuryEntry));
};

/** Get treasury summary */
export const getTreasurySummary = async (poolId: string): Promise<TreasurySummary> => {
  const fn = httpsCallable<{ poolId: string }, TreasurySummary>(functions, 'getTreasurySummary');
  const result = await fn({ poolId });
  return result.data;
};
