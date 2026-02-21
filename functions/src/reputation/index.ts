import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolAdmin, requireFeature } from "../middleware";
import { validateRequired } from "../utils";
import { logAudit } from "../audit";

const db = admin.firestore();

/**
 * Reputation Weight Formula:
 * score = (contributionScore * 0.4) + (votingParticipation * 0.3) + (proposalAccuracy * 0.3)
 * 
 * Normalized to 0-100 scale.
 * Pro tier only — gated by feature flag.
 */

function calculateReputationScore(
  contributionScore: number,
  votingParticipation: number,
  proposalAccuracy: number
): number {
  const raw =
    contributionScore * 0.4 +
    votingParticipation * 0.3 +
    proposalAccuracy * 0.3;
  // Normalize to 0-100 (cap at 100)
  return Math.min(100, Math.round(raw));
}

/**
 * Recalculate reputation scores for all members in a pool.
 * Pro tier only.
 */
export const recalculatePoolReputation = functions.https.onCall(
  async (data, context) => {
    const uid = requireAuth(context);
    validateRequired(data, ["poolId"]);

    await requirePoolAdmin(uid, data.poolId);
    await requireFeature(data.poolId, "reputationWeightedVoting");

    const poolRef = db.collection("pools").doc(data.poolId);
    const membersSnap = await poolRef.collection("members").get();

    // Get pool-level stats for normalization
    let maxContribution = 1;
    let maxVoting = 1;
    let maxAccuracy = 1;

    membersSnap.docs.forEach((doc) => {
      const m = doc.data();
      maxContribution = Math.max(maxContribution, m.contributionScore || 0);
      maxVoting = Math.max(maxVoting, m.votingParticipation || 0);
      maxAccuracy = Math.max(maxAccuracy, m.proposalAccuracy || 0);
    });

    const batch = db.batch();
    let updated = 0;

    membersSnap.docs.forEach((doc) => {
      const m = doc.data();
      // Normalize each metric to 0-100 scale
      const normContrib = ((m.contributionScore || 0) / maxContribution) * 100;
      const normVoting = ((m.votingParticipation || 0) / maxVoting) * 100;
      const normAccuracy = ((m.proposalAccuracy || 0) / maxAccuracy) * 100;

      const score = calculateReputationScore(normContrib, normVoting, normAccuracy);

      batch.update(doc.ref, { reputationScore: score });
      updated++;
    });

    await batch.commit();

    await logAudit({
      poolId: data.poolId,
      action: "REPUTATION_RECALCULATED",
      performedBy: uid,
      targetResource: "pool",
      targetResourceId: data.poolId,
      details: { membersUpdated: updated },
    });

    return { message: `Reputation recalculated for ${updated} members.` };
  }
);

/**
 * Get reputation leaderboard for a pool.
 */
export const getReputationLeaderboard = functions.https.onCall(
  async (data, context) => {
    const uid = requireAuth(context);
    validateRequired(data, ["poolId"]);

    await requireFeature(data.poolId, "reputationWeightedVoting");

    const membersSnap = await db
      .collection("pools")
      .doc(data.poolId)
      .collection("members")
      .orderBy("reputationScore", "desc")
      .limit(data.limit || 50)
      .get();

    const leaderboard = membersSnap.docs.map((doc) => {
      const m = doc.data();
      return {
        uid: m.uid,
        role: m.role,
        reputationScore: m.reputationScore || 0,
        contributionScore: m.contributionScore || 0,
        votingParticipation: m.votingParticipation || 0,
        proposalAccuracy: m.proposalAccuracy || 0,
      };
    });

    return { leaderboard };
  }
);
