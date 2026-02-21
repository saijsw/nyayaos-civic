import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requireSuperAdmin } from "../middleware";
import { validateRequired } from "../utils";
import { logAudit } from "../audit";
import { getFlagsForTier } from "../featureFlags";
import { SubscriptionTier } from "../types";

const db = admin.firestore();

/**
 * Freeze a pool (super admin only).
 */
export const freezePool = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  await requireSuperAdmin(uid);
  validateRequired(data, ["poolId"]);

  await db.collection("pools").doc(data.poolId).update({ frozen: true });

  await logAudit({
    poolId: data.poolId,
    action: "POOL_FROZEN",
    performedBy: uid,
    targetResource: "pool",
    targetResourceId: data.poolId,
  });

  return { message: "Pool frozen." };
});

/**
 * Unfreeze a pool (super admin only).
 */
export const unfreezePool = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  await requireSuperAdmin(uid);
  validateRequired(data, ["poolId"]);

  await db.collection("pools").doc(data.poolId).update({ frozen: false });

  await logAudit({
    poolId: data.poolId,
    action: "POOL_UNFROZEN",
    performedBy: uid,
    targetResource: "pool",
    targetResourceId: data.poolId,
  });

  return { message: "Pool unfrozen." };
});

/**
 * Upgrade a pool's subscription tier (super admin only).
 */
export const upgradePoolTier = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  await requireSuperAdmin(uid);
  validateRequired(data, ["poolId", "newTier"]);

  const validTiers: SubscriptionTier[] = ["free", "pro", "federation"];
  if (!validTiers.includes(data.newTier)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid tier. Must be: free, pro, or federation."
    );
  }

  const batch = db.batch();

  // Update pool tier
  batch.update(db.collection("pools").doc(data.poolId), {
    subscriptionTier: data.newTier,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update or create subscription record
  const subSnap = await db
    .collection("subscriptions")
    .where("poolId", "==", data.poolId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!subSnap.empty) {
    batch.update(subSnap.docs[0].ref, {
      tier: data.newTier,
      featureFlags: getFlagsForTier(data.newTier),
    });
  } else {
    const newSubRef = db.collection("subscriptions").doc();
    batch.set(newSubRef, {
      subscriptionId: newSubRef.id,
      poolId: data.poolId,
      tier: data.newTier,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
      featureFlags: getFlagsForTier(data.newTier),
    });
  }

  await batch.commit();

  await logAudit({
    poolId: data.poolId,
    action: "TIER_UPGRADED",
    performedBy: uid,
    targetResource: "subscription",
    targetResourceId: data.poolId,
    details: { newTier: data.newTier },
  });

  return { message: `Pool upgraded to ${data.newTier}.` };
});

/**
 * Promote a user to super admin (super admin only).
 */
export const promoteSuperAdmin = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  await requireSuperAdmin(uid);
  validateRequired(data, ["targetUid"]);

  await db.collection("users").doc(data.targetUid).update({
    globalRole: "superadmin",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { message: "User promoted to super admin." };
});
