import { useFirestoreQuery, orderBy, limit } from "./useFirestoreQuery";
import type { Proposal, TreasuryTransaction, Case, Member, AuditLog } from "../types";

/**
 * Hook to fetch all pool sub-collection data with real-time updates.
 */
export function usePoolProposals(poolId: string) {
  return useFirestoreQuery<Proposal>(
    `pools/${poolId}/proposals`,
    [orderBy("createdAt", "desc")],
    !!poolId
  );
}

export function usePoolTreasury(poolId: string, txLimit = 20) {
  return useFirestoreQuery<TreasuryTransaction>(
    `pools/${poolId}/treasury`,
    [orderBy("createdAt", "desc"), limit(txLimit)],
    !!poolId
  );
}

export function usePoolCases(poolId: string) {
  return useFirestoreQuery<Case>(
    `pools/${poolId}/cases`,
    [orderBy("createdAt", "desc")],
    !!poolId
  );
}

export function usePoolMembers(poolId: string) {
  return useFirestoreQuery<Member>(
    `pools/${poolId}/members`,
    [],
    !!poolId
  );
}

export function usePoolAuditLogs(poolId: string, logLimit = 50) {
  return useFirestoreQuery<AuditLog>(
    `pools/${poolId}/auditLogs`,
    [orderBy("timestamp", "desc"), limit(logLimit)],
    !!poolId
  );
}
