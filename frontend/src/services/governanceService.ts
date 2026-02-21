import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface Proposal {
  id: string;
  poolId: string;
  title: string;
  description: string;
  type: 'budget' | 'policy' | 'case_action' | 'membership' | 'custom';
  status: 'active' | 'passed' | 'rejected' | 'expired';
  createdBy: string;
  votes: Record<string, { vote: 'yes' | 'no' | 'abstain'; weight: number; timestamp: Timestamp }>;
  votesFor: number;
  votesAgainst: number;
  approvalThreshold: number;
  deadline: Timestamp;
  createdAt: Timestamp;
}

/** Create a new proposal */
export const createProposal = async (data: {
  poolId: string;
  title: string;
  description: string;
  type: Proposal['type'];
}) => {
  const fn = httpsCallable(functions, 'createProposal');
  return fn(data);
};

/** Get proposals for a pool */
export const getPoolProposals = async (
  poolId: string,
  status?: Proposal['status']
): Promise<Proposal[]> => {
  let q = query(
    collection(db, 'proposals'),
    where('poolId', '==', poolId),
    orderBy('createdAt', 'desc')
  );
  if (status) {
    q = query(
      collection(db, 'proposals'),
      where('poolId', '==', poolId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Proposal));
};

/** Cast a vote */
export const castVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
  const fn = httpsCallable(functions, 'castVote');
  return fn({ proposalId, vote });
};

/** Get single proposal */
export const getProposal = async (proposalId: string): Promise<Proposal | null> => {
  const snap = await getDoc(doc(db, 'proposals', proposalId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Proposal : null;
};
