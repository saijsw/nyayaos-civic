// ============================================
// NyayaOS Civic — Frontend Type Definitions
// ============================================

export type SubscriptionTier = "free" | "pro" | "federation";
export type PoolRole = "member" | "admin" | "owner";
export type GlobalRole = "user" | "superadmin";
export type ProposalStatus = "active" | "passed" | "rejected" | "expired";
export type CaseStatus = "filed" | "in_progress" | "hearing" | "resolved" | "closed";
export type TreasuryTxType = "contribution" | "expense" | "refund" | "federation_contribution";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  globalRole: GlobalRole;
  pools: string[];
}

export interface Pool {
  poolId: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  subscriptionTier: SubscriptionTier;
  ownerId: string;
  memberCount: number;
  frozen: boolean;
  governanceSettings: GovernanceSettings;
  transparencyEnabled: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface GovernanceSettings {
  approvalThreshold: number;
  votingDurationDays: number;
  allowReputationWeighting: boolean;
  customRules?: Record<string, any>;
}

export interface Member {
  memberId: string;
  poolId: string;
  uid: string;
  role: PoolRole;
  joinedAt: any;
  reputationScore?: number;
}

export interface Proposal {
  proposalId: string;
  poolId: string;
  title: string;
  description: string;
  createdBy: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  weightedVotesFor?: number;
  weightedVotesAgainst?: number;
  totalEligibleVoters: number;
  createdAt: any;
  expiresAt: any;
}

export interface Vote {
  voteId: string;
  proposalId: string;
  poolId: string;
  voterId: string;
  vote: "for" | "against" | "abstain";
  weight?: number;
  castAt: any;
}

export interface Case {
  caseId: string;
  poolId: string;
  title: string;
  description: string;
  caseType: string;
  courtLevel: string;
  status: CaseStatus;
  stages: CaseStage[];
  projectedCost?: number;
  actualCost?: number;
}

export interface CaseStage {
  stageName: string;
  status: "pending" | "current" | "completed";
  date?: any;
  notes?: string;
}

export interface TreasuryTransaction {
  txId: string;
  poolId: string;
  type: TreasuryTxType;
  amount: number;
  currency: string;
  description: string;
  createdBy: string;
  createdAt: any;
  balanceAfter: number;
}

export interface FederationGroup {
  federationId: string;
  title: string;
  description: string;
  memberPools: string[];
  sharedTreasuryBalance: number;
  governanceModel: "equal" | "weighted";
}

export interface AuditLog {
  logId: string;
  poolId: string;
  action: string;
  performedBy: string;
  targetResource: string;
  targetResourceId: string;
  details: Record<string, any>;
  timestamp: any;
}

export interface CostProjection {
  projectionId: string;
  poolId: string;
  caseId: string;
  caseType: string;
  courtLevel: string;
  estimatedDurationMonths: number;
  projectedCost: number;
  breakdown: { category: string; amount: number; notes?: string }[];
}

export interface FeatureFlags {
  reputationWeightedVoting: boolean;
  advancedAnalytics: boolean;
  costProjection: boolean;
  privatePools: boolean;
  customGovernance: boolean;
  dataExport: boolean;
  federationAccess: boolean;
  sharedWarChest: boolean;
  interPoolVoting: boolean;
  federationAnalytics: boolean;
}
