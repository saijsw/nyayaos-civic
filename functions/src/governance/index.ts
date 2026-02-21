import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolMember, requirePoolAdmin, checkPoolNotFrozen, requireFeature } from "../middleware";
import { logAudit } from "../audit";
import { validateRequired, sanitize } from "../utils";
import { isFeatureEnabled } from "../featureFlags";
import { SubscriptionTier } from "../types";

const db = admin.firestore();

/**
 * Create a new proposal in a pool.
 * Any pool member can create proposals.
 */
export const createProposal = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "title", "description"]);

  await requirePoolMember(uid, data.poolId);
  const pool = await checkPoolNotFrozen(data.poolId);

  const poolRef = db.collection("pools").doc(data.poolId);
  const proposalRef = poolRef.collection("proposals").doc();

  // Calculate expiry based on governance settings
  const votingDays = pool.governanceSettings?.votingDurationDays || 7;
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + votingDays * 24 * 60 * 60 * 1000)
  );

  // Get member count for total eligible voters
  const membersSnap = await poolRef.collection("members").get();

  const proposalDoc = {
    proposalId: proposalRef.id,
    poolId: data.poolId,
    title: sanitize(data.title),
    description: sanitize(data.description),
    createdBy: uid,
    status: "active",
    votesFor: 0,
    votesAgainst: 0,
    weightedVotesFor: 0,
    weightedVotesAgainst: 0,
    totalEligibleVoters: membersSnap.size,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
  };

  await proposalRef.set(proposalDoc);

  await logAudit({
    poolId: data.poolId,
    action: "PROPOSAL_CREATED",
    performedBy: uid,
    targetResource: "proposal",
    targetResourceId: proposalRef.id,
    details: { title: proposalDoc.title },
  });

  return { proposalId: proposalRef.id, message: "Proposal created." };
});

/**
 * Cast a vote on an active proposal.
 * Each member can vote once. Vote weight depends on tier.
 */
export const castVote = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "proposalId", "vote"]);

  if (!["for", "against", "abstain"].includes(data.vote)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Vote must be 'for', 'against', or 'abstain'."
    );
  }

  const member = await requirePoolMember(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  const poolRef = db.collection("pools").doc(data.poolId);
  const proposalRef = poolRef.collection("proposals").doc(data.proposalId);

  // Verify proposal exists and is active
  const proposalSnap = await proposalRef.get();
  if (!proposalSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Proposal not found.");
  }
  const proposal = proposalSnap.data()!;
  if (proposal.status !== "active") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Proposal is no longer active."
    );
  }

  // Check if already expired
  if (proposal.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Voting period has ended."
    );
  }

  // Check if already voted
  const voteRef = proposalRef.collection("votes").doc(uid);
  const existingVote = await voteRef.get();
  if (existingVote.exists) {
    throw new functions.https.HttpsError(
      "already-exists",
      "You have already voted on this proposal."
    );
  }

  // Determine vote weight
  const poolSnap = await poolRef.get();
  const tier = (poolSnap.data()?.subscriptionTier || "free") as SubscriptionTier;
  let weight = 1;

  if (isFeatureEnabled(tier, "reputationWeightedVoting") && member.reputationScore) {
    // Weight is normalized reputation score (0.5 to 2.0 range)
    weight = Math.max(0.5, Math.min(2.0, member.reputationScore / 50));
  }

  const batch = db.batch();

  // Write the vote
  batch.set(voteRef, {
    voteId: uid,
    proposalId: data.proposalId,
    poolId: data.poolId,
    voterId: uid,
    vote: data.vote,
    weight,
    castAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update proposal tallies
  if (data.vote === "for") {
    batch.update(proposalRef, {
      votesFor: admin.firestore.FieldValue.increment(1),
      weightedVotesFor: admin.firestore.FieldValue.increment(weight),
    });
  } else if (data.vote === "against") {
    batch.update(proposalRef, {
      votesAgainst: admin.firestore.FieldValue.increment(1),
      weightedVotesAgainst: admin.firestore.FieldValue.increment(weight),
    });
  }

  await batch.commit();

  // Update member's voting participation
  await poolRef.collection("members").doc(uid).update({
    votingParticipation: admin.firestore.FieldValue.increment(1),
  });

  await logAudit({
    poolId: data.poolId,
    action: "VOTE_CAST",
    performedBy: uid,
    targetResource: "proposal",
    targetResourceId: data.proposalId,
    details: { vote: data.vote, weight },
  });

  return { message: "Vote cast successfully.", weight };
});

/**
 * Manually close a proposal (admin only).
 * Calculates final result based on governance settings.
 */
export const closeProposal = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "proposalId"]);

  await requirePoolAdmin(uid, data.poolId);

  const poolRef = db.collection("pools").doc(data.poolId);
  const proposalRef = poolRef.collection("proposals").doc(data.proposalId);

  const proposalSnap = await proposalRef.get();
  if (!proposalSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Proposal not found.");
  }

  const proposal = proposalSnap.data()!;
  if (proposal.status !== "active") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Proposal is already closed."
    );
  }

  const pool = (await poolRef.get()).data()!;
  const threshold = pool.governanceSettings?.approvalThreshold || 51;
  const tier = pool.subscriptionTier as SubscriptionTier;

  // Use weighted votes for Pro/Federation, simple count for Free
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
  const status = approvalPercent >= threshold ? "passed" : "rejected";

  await proposalRef.update({ status });

  await logAudit({
    poolId: data.poolId,
    action: "PROPOSAL_CLOSED",
    performedBy: uid,
    targetResource: "proposal",
    targetResourceId: data.proposalId,
    details: { status, approvalPercent, threshold },
  });

  return { status, approvalPercent, message: `Proposal ${status}.` };
});
