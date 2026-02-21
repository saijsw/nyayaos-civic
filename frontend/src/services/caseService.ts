import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase';

export interface LegalCase {
  id: string;
  poolId: string;
  title: string;
  description: string;
  caseType: 'civil' | 'criminal' | 'constitutional' | 'consumer' | 'environmental' | 'labor';
  courtLevel: 'district' | 'high_court' | 'supreme_court' | 'tribunal';
  status: 'filing' | 'discovery' | 'hearing' | 'judgment' | 'appeal' | 'closed';
  filedDate?: Timestamp;
  nextHearing?: Timestamp;
  assignedLawyer?: string;
  projectedCost?: { min: number; max: number; currency: string };
  actualCost?: number;
  createdBy: string;
  createdAt: Timestamp;
}

/** Create a new case */
export const createCase = async (data: {
  poolId: string;
  title: string;
  description: string;
  caseType: LegalCase['caseType'];
  courtLevel: LegalCase['courtLevel'];
}) => {
  const fn = httpsCallable(functions, 'createCase');
  return fn(data);
};

/** Get cases for a pool */
export const getPoolCases = async (poolId: string): Promise<LegalCase[]> => {
  const q = query(
    collection(db, 'cases'),
    where('poolId', '==', poolId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LegalCase));
};

/** Get single case */
export const getCase = async (caseId: string): Promise<LegalCase | null> => {
  const snap = await getDoc(doc(db, 'cases', caseId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as LegalCase : null;
};

/** Update case status */
export const updateCaseStatus = async (caseId: string, status: LegalCase['status']) => {
  const fn = httpsCallable(functions, 'updateCaseStatus');
  return fn({ caseId, status });
};

/** Get cost projection for a case */
export const getCostProjection = async (data: {
  caseType: LegalCase['caseType'];
  courtLevel: LegalCase['courtLevel'];
  durationMonths?: number;
}) => {
  const fn = httpsCallable(functions, 'getCostProjection');
  return fn(data);
};
