import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolAdmin, requireSuperAdmin } from "../middleware";
import { validateRequired } from "../utils";

const db = admin.firestore();

/**
 * Pool-level analytics.
 */
export const getPoolAnalytics = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId"]);
  await requirePoolAdmin(uid, data.poolId);

  const poolRef = db.collection("pools").doc(data.poolId);

  const [membersSnap, proposalsSnap, casesSnap, treasurySnap] = await Promise.all([
    poolRef.collection("members").get(),
    poolRef.collection("proposals").get(),
    poolRef.collection("cases").get(),
    poolRef.collection("treasury").get(),
  ]);

  const proposals = proposalsSnap.docs.map((d) => d.data());
  const activeProposals = proposals.filter((p) => p.status === "active").length;
  const passedProposals = proposals.filter((p) => p.status === "passed").length;

  const cases = casesSnap.docs.map((d) => d.data());
  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status)).length;

  let totalContributions = 0;
  let totalExpenses = 0;
  let currentBalance = 0;

  treasurySnap.docs.forEach((d) => {
    const tx = d.data();
    if (tx.type === "contribution") totalContributions += tx.amount;
    if (tx.type === "expense") totalExpenses += Math.abs(tx.amount);
  });

  if (!treasurySnap.empty) {
    // Sort by createdAt desc to find latest
    const sorted = treasurySnap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    currentBalance = sorted[0]?.balanceAfter || 0;
  }

  return {
    memberCount: membersSnap.size,
    proposalStats: {
      total: proposals.length,
      active: activeProposals,
      passed: passedProposals,
      rejected: proposals.filter((p) => p.status === "rejected").length,
      expired: proposals.filter((p) => p.status === "expired").length,
    },
    caseStats: {
      total: cases.length,
      active: activeCases,
      resolved: cases.filter((c) => c.status === "resolved").length,
    },
    treasury: {
      currentBalance,
      totalContributions,
      totalExpenses,
    },
  };
});

/**
 * Global analytics (super admin only).
 */
export const getGlobalAnalytics = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  await requireSuperAdmin(uid);

  const [usersSnap, poolsSnap, fedsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("pools").get(),
    db.collection("federationGroups").get(),
  ]);

  const pools = poolsSnap.docs.map((d) => d.data());
  const tierBreakdown = {
    free: pools.filter((p) => p.subscriptionTier === "free").length,
    pro: pools.filter((p) => p.subscriptionTier === "pro").length,
    federation: pools.filter((p) => p.subscriptionTier === "federation").length,
  };

  return {
    totalUsers: usersSnap.size,
    totalPools: pools.length,
    totalFederations: fedsSnap.size,
    tierBreakdown,
    frozenPools: pools.filter((p) => p.frozen).length,
    publicPools: pools.filter((p) => p.visibility === "public").length,
  };
});
