import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface Pool {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  subscriptionTier: 'free' | 'pro' | 'federation';
  visibility: 'public' | 'private';
  members: string[];
  admins: string[];
  status: 'active' | 'frozen';
  governanceSettings: {
    approvalThreshold: number;
    votingDuration: number;
    allowReputationWeighting: boolean;
  };
  createdAt: Timestamp;
}

/** Create a new pool */
export const createPool = async (data: {
  name: string;
  description: string;
  createdBy: string;
  visibility?: 'public' | 'private';
}) => {
  const createPoolFn = httpsCallable(functions, 'createPool');
  return createPoolFn(data);
};

/** Get pool by ID */
export const getPool = async (poolId: string): Promise<Pool | null> => {
  const snap = await getDoc(doc(db, 'pools', poolId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Pool : null;
};

/** Get all pools for a user */
export const getUserPools = async (userId: string): Promise<Pool[]> => {
  const q = query(
    collection(db, 'pools'),
    where('members', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Pool));
};

/** Get public pools */
export const getPublicPools = async (maxResults = 20): Promise<Pool[]> => {
  const q = query(
    collection(db, 'pools'),
    where('visibility', '==', 'public'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Pool));
};

/** Join a pool */
export const joinPool = async (poolId: string, userId: string) => {
  const joinPoolFn = httpsCallable(functions, 'joinPool');
  return joinPoolFn({ poolId, userId });
};

/** Leave a pool */
export const leavePool = async (poolId: string, userId: string) => {
  const leavePoolFn = httpsCallable(functions, 'leavePool');
  return leavePoolFn({ poolId, userId });
};

/** Update pool settings (admin only) */
export const updatePoolSettings = async (
  poolId: string,
  settings: Partial<Pool['governanceSettings']>
) => {
  await updateDoc(doc(db, 'pools', poolId), {
    governanceSettings: settings,
    updatedAt: serverTimestamp(),
  });
};
