import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { isFeatureEnabled } from "../featureFlags";
import { SubscriptionTier } from "../types";

const db = admin.firestore();

/**
 * Auto-close expired proposals — runs every hour.
 * Checks all active proposals whose expiresAt has passed.
 */
export const autoCloseExpiredProposals = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // Query all pools
    const poolsSnap = await db.collection("pools").get();
    let closedCount = 0;

    for (const poolDoc of poolsSnap.docs) {
      const pool = poolDoc.data();
      const threshold = pool.governanceSettings?.approvalThreshold || 51;
      const tier = (pool.subscriptionTier || "free") as SubscriptionTier;

      // Get expired active proposals
      const proposalsSnap = await poolDoc.ref
        .collection("proposals")
        .where("status", "==", "active")
        .where("expiresAt", "<=", now)
        .get();

      for (const propDoc of proposalsSnap.docs) {
        const proposal = propDoc.data();

        let forCount: number;
        let totalCount: number;

        if (isFeatureEnabled(tier, "reputationWeightedVoting")) {
          forCount = proposal.weightedVotesFor || 0;
          totalCount = (proposal.weightedVotesFor || 0) + (proposal.weightedVotesAgainst || 0);
        } else {
          forCount = proposal.votesFor || 0;
          totalCount = (proposal.votesFor || 0) + (proposal.votesAgainst || 0);
        }

        const approvalPercent = totalCount > 0 ? (forCount / totalCount) * 100 : 0;
        const status = approvalPercent >= threshold ? "passed" : "expired";

        await propDoc.ref.update({ status });

        // Write audit log
        await poolDoc.ref.collection("auditLogs").doc().set({
          logId: "",
          poolId: pool.poolId,
          action: "PROPOSAL_AUTO_CLOSED",
          performedBy: "system",
          targetResource: "proposal",
          targetResourceId: propDoc.id,
          details: { status, approvalPercent, threshold },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          immutable: true,
        });

        closedCount++;
      }
    }

    functions.logger.info(`Auto-closed ${closedCount} expired proposals.`);
    return null;
  });

/**
 * Recalculate reputation scores for all Pro pools — runs daily.
 */
export const dailyReputationRecalc = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const proPools = await db
      .collection("pools")
      .where("subscriptionTier", "in", ["pro", "federation"])
      .get();

    let updated = 0;

    for (const poolDoc of proPools.docs) {
      const membersSnap = await poolDoc.ref.collection("members").get();

      let maxContrib = 1, maxVoting = 1, maxAccuracy = 1;
      membersSnap.docs.forEach((doc) => {
        const m = doc.data();
        maxContrib = Math.max(maxContrib, m.contributionScore || 0);
        maxVoting = Math.max(maxVoting, m.votingParticipation || 0);
        maxAccuracy = Math.max(maxAccuracy, m.proposalAccuracy || 0);
      });

      const batch = db.batch();
      membersSnap.docs.forEach((doc) => {
        const m = doc.data();
        const normC = ((m.contributionScore || 0) / maxContrib) * 100;
        const normV = ((m.votingParticipation || 0) / maxVoting) * 100;
        const normA = ((m.proposalAccuracy || 0) / maxAccuracy) * 100;
        const score = Math.min(100, Math.round(normC * 0.4 + normV * 0.3 + normA * 0.3));
        batch.update(doc.ref, { reputationScore: score });
        updated++;
      });
      await batch.commit();
    }

    functions.logger.info(`Daily reputation recalc: ${updated} members updated.`);
    return null;
  });

/**
 * Sync transparency data for public pools — runs every 6 hours.
 */
export const syncTransparencyData = functions.pubsub
  .schedule("every 6 hours")
  .onRun(async () => {
    const publicPools = await db
      .collection("pools")
      .where("visibility", "==", "public")
      .where("transparencyEnabled", "==", true)
      .get();

    let synced = 0;

    for (const poolDoc of publicPools.docs) {
      const pool = poolDoc.data();

      // Get treasury summary
      const treasurySnap = await poolDoc.ref
        .collection("treasury")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      const balance = treasurySnap.empty ? 0 : treasurySnap.docs[0].data().balanceAfter;

      // Get proposal summary
      const proposalsSnap = await poolDoc.ref.collection("proposals").get();
      const proposals = proposalsSnap.docs.map((d) => ({
        title: d.data().title,
        status: d.data().status,
        votesFor: d.data().votesFor,
        votesAgainst: d.data().votesAgainst,
      }));

      // Get case stages
      const casesSnap = await poolDoc.ref.collection("cases").get();
      const cases = casesSnap.docs.map((d) => ({
        title: d.data().title,
        status: d.data().status,
        stages: d.data().stages || [],
      }));

      // Write to public transparency collection
      await db.collection("transparency").doc(pool.poolId).set({
        poolId: pool.poolId,
        poolName: pool.name,
        memberCount: pool.memberCount,
        treasuryBalance: balance,
        proposalSummary: proposals,
        caseSummary: cases,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      synced++;
    }

    functions.logger.info(`Transparency sync: ${synced} pools updated.`);
    return null;
  });
