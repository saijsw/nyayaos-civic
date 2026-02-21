import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Typed wrapper around Firebase callable functions.
 */
function callFunction<T = any>(name: string) {
  const fn = httpsCallable<any, T>(functions, name);
  return async (data?: any): Promise<T> => {
    const result = await fn(data || {});
    return result.data;
  };
}

// ---- Pool APIs ----
export const createPool = callFunction("createPool");
export const updatePool = callFunction("updatePool");
export const addMember = callFunction("addMember");
export const removeMember = callFunction("removeMember");

// ---- Governance APIs ----
export const createProposal = callFunction("createProposal");
export const castVote = callFunction("castVote");
export const closeProposal = callFunction("closeProposal");

// ---- Treasury APIs ----
export const recordContribution = callFunction("recordContribution");
export const recordExpense = callFunction("recordExpense");
export const getTreasuryOverview = callFunction("getTreasuryOverview");

// ---- Reputation APIs ----
export const recalculatePoolReputation = callFunction("recalculatePoolReputation");
export const getReputationLeaderboard = callFunction("getReputationLeaderboard");

// ---- Cost Projection APIs ----
export const generateCostProjection = callFunction("generateCostProjection");

// ---- Federation APIs ----
export const createFederationApi = callFunction("createFederation");
export const joinFederation = callFunction("joinFederation");
export const contributeToWarChest = callFunction("contributToWarChest");
export const getFederationOverview = callFunction("getFederationOverview");

// ---- Analytics APIs ----
export const getPoolAnalytics = callFunction("getPoolAnalytics");
export const getGlobalAnalytics = callFunction("getGlobalAnalytics");

// ---- Admin APIs ----
export const freezePool = callFunction("freezePool");
export const unfreezePool = callFunction("unfreezePool");
export const upgradePoolTier = callFunction("upgradePoolTier");
export const promoteSuperAdmin = callFunction("promoteSuperAdmin");

// ---- Notification APIs ----
export const getNotifications = callFunction("getNotifications");
export const markNotificationRead = callFunction("markNotificationRead");
