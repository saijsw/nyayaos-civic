import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface Federation {
  id: string;
  title: string;
  description: string;
  memberPools: string[];
  sharedTreasury: { balance: number; currency: string };
  governanceModel: 'equal' | 'weighted' | 'delegated';
  status: 'active' | 'dissolved';
  createdBy: string;
  createdAt: Timestamp;
}

export interface FederationLedgerEntry {
  id: string;
  federationId: string;
  poolId: string;
  type: 'contribution' | 'expense';
  amount: number;
  description: string;
  createdAt: Timestamp;
}

/** Create a federation */
export const createFederation = async (data: {
  title: string;
  description: string;
  governanceModel: Federation['governanceModel'];
}) => {
  const fn = httpsCallable(functions, 'createFederation');
  return fn(data);
};

/** Get federation by ID */
export const getFederation = async (federationId: string): Promise<Federation | null> => {
  const snap = await getDoc(doc(db, 'federationGroups', federationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Federation : null;
};

/** Get federations a pool belongs to */
export const getPoolFederations = async (poolId: string): Promise<Federation[]> => {
  const q = query(
    collection(db, 'federationGroups'),
    where('memberPools', 'array-contains', poolId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Federation));
};

/** Join a federation */
export const joinFederation = async (federationId: string, poolId: string) => {
  const fn = httpsCallable(functions, 'joinFederation');
  return fn({ federationId, poolId });
};

/** Get federation ledger */
export const getFederationLedger = async (federationId: string): Promise<FederationLedgerEntry[]> => {
  const q = query(
    collection(db, 'federationLedger'),
    where('federationId', '==', federationId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FederationLedgerEntry));
};

/** Contribute to federation war chest */
export const contributeTroFederation = async (data: {
  federationId: string;
  poolId: string;
  amount: number;
  description: string;
}) => {
  const fn = httpsCallable(functions, 'contributeToFederation');
  return fn(data);
};
