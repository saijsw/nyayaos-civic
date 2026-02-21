// ============================================
// NyayaOS Civic — Shared Type Definitions
// ============================================

/** Subscription tiers controlling feature access */
export type SubscriptionTier = "free" | "pro" | "federation";

/** User roles within a pool */
export type PoolRole = "member" | "admin" | "owner";

/** Global platform roles */
export type GlobalRole = "user" | "superadmin";

/** Proposal status lifecycle */
export type ProposalStatus = "active" | "passed" | "rejected" | "expired";

/** Case status lifecycle */
export type CaseStatus = "filed" | "in_progress" | "hearing" | "resolved" | "closed";

/** Treasury transaction types */
export type TreasuryTxType = "contribution" | "expense" | "refund" | "federation_contribution";

/** Federation ledger entry types */
export type FederationLedgerType = "pool_contribution" | "expense" | "distribution";

// ---- Firestore Document Interfaces ----

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  globalRole: GlobalRole;
  pools: string[]; // poolIds the user belongs to
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface PoolDoc {
  poolId: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  subscriptionTier: SubscriptionTier;
  ownerId: string;
  memberCount: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  frozen: boolean;
  governanceSettings: GovernanceSettings;
  transparencyEnabled: boolean;
}

export interface GovernanceSettings {
  approvalThreshold: number; // percentage (0-100)
  votingDurationDays: number;
  allowReputationWeighting: boolean; // only effective if tier >= pro
  customRules?: Record<string, any>;
}

export interface MemberDoc {
  memberId: string;
  poolId: string;
  uid: string;
  role: PoolRole;
  joinedAt: FirebaseFirestore.Timestamp;
  reputationScore?: number; // Pro tier only
  contributionScore?: number;
  votingParticipation?: number;
  proposalAccuracy?: number;
}

export interface ProposalDoc {
  proposalId: string;
  poolId: string;
  title: string;
  description: string;
  createdBy: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  weightedVotesFor?: number; // Pro tier
  weightedVotesAgainst?: number; // Pro tier
  totalEligibleVoters: number;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}

export interface VoteDoc {
  voteId: string;
  proposalId: string;
  poolId: string;
  voterId: string;
  vote: "for" | "against" | "abstain";
  weight?: number; // Pro tier reputation weight
  castAt: FirebaseFirestore.Timestamp;
}

export interface CaseDoc {
  caseId: string;
  poolId: string;
  title: string;
  description: string;
  caseType: string;
  courtLevel: string;
  status: CaseStatus;
  filedDate: FirebaseFirestore.Timestamp;
  estimatedDurationMonths?: number;
  projectedCost?: number;
  actualCost?: number;
  stages: CaseStage[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CaseStage {
  stageName: string;
  status: "pending" | "current" | "completed";
  date?: FirebaseFirestore.Timestamp;
  notes?: string;
}

export interface TreasuryTx {
  txId: string;
  poolId: string;
  type: TreasuryTxType;
  amount: number;
  currency: string;
  description: string;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  balanceAfter: number;
}

export interface SubscriptionDoc {
  subscriptionId: string;
  poolId: string;
  tier: SubscriptionTier;
  startDate: FirebaseFirestore.Timestamp;
  endDate?: FirebaseFirestore.Timestamp;
  status: "active" | "expired" | "pending_approval";
  featureFlags: Record<string, boolean>;
}

export interface FederationGroupDoc {
  federationId: string;
  title: string;
  description: string;
  memberPools: string[];
  sharedTreasuryBalance: number;
  governanceModel: "equal" | "weighted";
  createdAt: FirebaseFirestore.Timestamp;
}

export interface FederationLedgerEntry {
  entryId: string;
  federationId: string;
  poolId: string;
  type: FederationLedgerType;
  amount: number;
  description: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface AuditLogDoc {
  logId: string;
  poolId: string;
  action: string;
  performedBy: string;
  targetResource: string;
  targetResourceId: string;
  details: Record<string, any>;
  timestamp: FirebaseFirestore.Timestamp;
  immutable: true; // always true — audit logs cannot be modified
}

export interface CostProjection {
  projectionId: string;
  poolId: string;
  caseId: string;
  caseType: string;
  courtLevel: string;
  estimatedDurationMonths: number;
  projectedCost: number;
  breakdown: CostBreakdownItem[];
  createdAt: FirebaseFirestore.Timestamp;
}

export interface CostBreakdownItem {
  category: string; // e.g., "filing_fee", "lawyer_fee", "court_fee"
  amount: number;
  notes?: string;
}

/** Feature flags map per tier */
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
