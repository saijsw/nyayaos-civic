import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolAdmin, requireSuperAdmin, checkPoolNotFrozen } from "../middleware";
import { logAudit } from "../audit";
import { validateRequired, sanitize } from "../utils";
import { getFlagsForTier } from "../featureFlags";

const db = admin.firestore();

/**
 * Create a new legal pool.
 * The creator becomes the owner automatically.
 */
export const createPool = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["name", "description"]);

  const poolRef = db.collection("pools").doc();
  const poolId = poolRef.id;
  const tier = "free"; // All new pools start on free tier

  const poolDoc = {
    poolId,
    name: sanitize(data.name),
    description: sanitize(data.description),
    visibility: data.visibility === "private" ? "private" : "public",
    subscriptionTier: tier,
    ownerId: uid,
    memberCount: 1,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    frozen: false,
    governanceSettings: {
      approvalThreshold: 51, // default simple majority
      votingDurationDays: 7,
      allowReputationWeighting: false,
      customRules: {},
    },
    transparencyEnabled: true,
  };

  const memberDoc = {
    memberId: uid,
    poolId,
    uid,
    role: "owner",
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    reputationScore: 0,
    contributionScore: 0,
    votingParticipation: 0,
    proposalAccuracy: 0,
  };

  // Batch write: pool + owner membership + update user's pool list
  const batch = db.batch();
  batch.set(poolRef, poolDoc);
  batch.set(poolRef.collection("members").doc(uid), memberDoc);
  batch.update(db.collection("users").doc(uid), {
    pools: admin.firestore.FieldValue.arrayUnion(poolId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create subscription record
  const subRef = db.collection("subscriptions").doc();
  batch.set(subRef, {
    subscriptionId: subRef.id,
    poolId,
    tier,
    startDate: admin.firestore.FieldValue.serverTimestamp(),
    status: "active",
    featureFlags: getFlagsForTier(tier),
  });

  await batch.commit();

  await logAudit({
    poolId,
    action: "POOL_CREATED",
    performedBy: uid,
    targetResource: "pool",
    targetResourceId: poolId,
    details: { name: poolDoc.name },
  });

  return { poolId, message: "Pool created successfully." };
});

/**
 * Update pool settings (name, description, governance).
 */
export const updatePool = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId"]);

  await requirePoolAdmin(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  const updates: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (data.name) updates.name = sanitize(data.name);
  if (data.description) updates.description = sanitize(data.description);
  if (data.visibility) updates.visibility = data.visibility;
  if (data.governanceSettings) updates.governanceSettings = data.governanceSettings;
  if (data.transparencyEnabled !== undefined) updates.transparencyEnabled = data.transparencyEnabled;

  await db.collection("pools").doc(data.poolId).update(updates);

  await logAudit({
    poolId: data.poolId,
    action: "POOL_UPDATED",
    performedBy: uid,
    targetResource: "pool",
    targetResourceId: data.poolId,
    details: updates,
  });

  return { message: "Pool updated successfully." };
});

/**
 * Add a member to a pool.
 */
export const addMember = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "targetUid"]);

  await requirePoolAdmin(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  const targetUid = data.targetUid;
  const role = data.role || "member";

  // Check target user exists
  const userSnap = await db.collection("users").doc(targetUid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }

  // Check not already a member
  const existingMember = await db
    .collection("pools").doc(data.poolId)
    .collection("members").doc(targetUid).get();
  if (existingMember.exists) {
    throw new functions.https.HttpsError("already-exists", "User is already a member.");
  }

  const batch = db.batch();

  batch.set(
    db.collection("pools").doc(data.poolId).collection("members").doc(targetUid),
    {
      memberId: targetUid,
      poolId: data.poolId,
      uid: targetUid,
      role,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      reputationScore: 0,
      contributionScore: 0,
      votingParticipation: 0,
      proposalAccuracy: 0,
    }
  );

  batch.update(db.collection("pools").doc(data.poolId), {
    memberCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.update(db.collection("users").doc(targetUid), {
    pools: admin.firestore.FieldValue.arrayUnion(data.poolId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await logAudit({
    poolId: data.poolId,
    action: "MEMBER_ADDED",
    performedBy: uid,
    targetResource: "member",
    targetResourceId: targetUid,
    details: { role },
  });

  return { message: "Member added successfully." };
});

/**
 * Remove a member from a pool.
 */
export const removeMember = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "targetUid"]);

  await requirePoolAdmin(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  const targetUid = data.targetUid;

  // Cannot remove the owner
  const poolSnap = await db.collection("pools").doc(data.poolId).get();
  if (poolSnap.data()?.ownerId === targetUid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Cannot remove the pool owner."
    );
  }

  const batch = db.batch();

  batch.delete(
    db.collection("pools").doc(data.poolId).collection("members").doc(targetUid)
  );

  batch.update(db.collection("pools").doc(data.poolId), {
    memberCount: admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.update(db.collection("users").doc(targetUid), {
    pools: admin.firestore.FieldValue.arrayRemove(data.poolId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await logAudit({
    poolId: data.poolId,
    action: "MEMBER_REMOVED",
    performedBy: uid,
    targetResource: "member",
    targetResourceId: targetUid,
  });

  return { message: "Member removed successfully." };
});
