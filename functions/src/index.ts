import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// ============================================
// NyayaOS Civic — Cloud Functions Entry Point
// ============================================

// --- Auth Triggers ---
export { onUserCreated, onUserDeleted } from "./auth";

// --- Pool CRUD ---
export { createPool, updatePool, addMember, removeMember } from "./pools";

// --- Governance (Proposals & Voting) ---
export { createProposal, castVote, closeProposal } from "./governance";

// --- Treasury (Immutable Ledger) ---
export { recordContribution, recordExpense, getTreasuryOverview } from "./treasury";

// --- Reputation Engine (Pro) ---
export { recalculatePoolReputation, getReputationLeaderboard } from "./reputation";

// --- Cost Projection (Pro) ---
export { generateCostProjection } from "./costProjection";

// --- Federation Module ---
export {
  createFederation,
  joinFederation,
  contributToWarChest,
  getFederationOverview,
} from "./federation";

// --- Analytics ---
export { getPoolAnalytics, getGlobalAnalytics } from "./analytics";

// --- Admin / Super Admin ---
export { freezePool, unfreezePool, upgradePoolTier, promoteSuperAdmin } from "./admin";

// --- Notifications ---
export { getNotifications, markNotificationRead } from "./notifications";

// --- Public Transparency ---
export { getPublicTransparency } from "./transparency";

// --- Scheduled Tasks ---
export {
  autoCloseExpiredProposals,
  dailyReputationRecalc,
  syncTransparencyData,
} from "./scheduled";
