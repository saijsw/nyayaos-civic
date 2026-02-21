import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { SubscriptionTier } from "../types";
import { isFeatureEnabled, FeatureFlags } from "../featureFlags";

const db = admin.firestore();

/**
 * Auth Guard: Verify the caller is authenticated.
 * Use in callable functions: const uid = requireAuth(context);
 */
export function requireAuth(
  context: functions.https.CallableContext
): string {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }
  return context.auth.uid;
}

/**
 * Pool Membership Guard: Verify user is a member of the pool.
 * Returns the member document data.
 */
export async function requirePoolMember(uid: string, poolId: string) {
  const memberSnap = await db
    .collection("pools")
    .doc(poolId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnap.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not a member of this pool."
    );
  }
  return memberSnap.data()!;
}

/**
 * Pool Admin Guard: Verify user is an admin or owner of the pool.
 */
export async function requirePoolAdmin(uid: string, poolId: string) {
  const member = await requirePoolMember(uid, poolId);
  if (!["admin", "owner"].includes(member.role)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Pool admin or owner role required."
    );
  }
  return member;
}

/**
 * Pool Owner Guard: Verify user is the owner of the pool.
 */
export async function requirePoolOwner(uid: string, poolId: string) {
  const member = await requirePoolMember(uid, poolId);
  if (member.role !== "owner") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Pool owner role required."
    );
  }
  return member;
}

/**
 * Super Admin Guard: Verify user has superadmin global role.
 */
export async function requireSuperAdmin(uid: string) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists || userSnap.data()?.globalRole !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Super admin access required."
    );
  }
  return userSnap.data()!;
}

/**
 * Pool Frozen Check: Ensure pool is not frozen before mutations.
 */
export async function checkPoolNotFrozen(poolId: string) {
  const poolSnap = await db.collection("pools").doc(poolId).get();
  if (!poolSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Pool not found.");
  }
  if (poolSnap.data()?.frozen === true) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "This pool has been frozen by an administrator."
    );
  }
  return poolSnap.data()!;
}

/**
 * Feature Gate: Check if a feature is available for the pool's tier.
 */
export async function requireFeature(
  poolId: string,
  feature: keyof FeatureFlags
) {
  const poolSnap = await db.collection("pools").doc(poolId).get();
  if (!poolSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Pool not found.");
  }
  const tier = (poolSnap.data()?.subscriptionTier || "free") as SubscriptionTier;
  if (!isFeatureEnabled(tier, feature)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Feature "${feature}" requires a higher subscription tier. Current: ${tier}`
    );
  }
  return tier;
}
