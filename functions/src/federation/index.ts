import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolOwner, requireSuperAdmin, requireFeature } from "../middleware";
import { validateRequired, sanitize } from "../utils";
import { logAudit } from "../audit";

const db = admin.firestore();

/**
 * Create a new federation group.
 * Requires super admin approval.
 */
export const createFederation = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["title", "description", "initialPoolId"]);

  // Verify the pool is on federation tier
  await requireFeature(data.initialPoolId, "federationAccess");
  await requirePoolOwner(uid, data.initialPoolId);

  const fedRef = db.collection("federationGroups").doc();

  await fedRef.set({
    federationId: fedRef.id,
    title: sanitize(data.title),
    description: sanitize(data.description),
    memberPools: [data.initialPoolId],
    sharedTreasuryBalance: 0,
    governanceModel: data.governanceModel || "equal",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid,
    status: "active",
  });

  await logAudit({
    poolId: data.initialPoolId,
    action: "FEDERATION_CREATED",
    performedBy: uid,
    targetResource: "federation",
    targetResourceId: fedRef.id,
    details: { title: data.title },
  });

  return { federationId: fedRef.id, message: "Federation created." };
});

/**
 * Join a pool to an existing federation.
 */
export const joinFederation = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["federationId", "poolId"]);

  await requireFeature(data.poolId, "federationAccess");
  await requirePoolOwner(uid, data.poolId);

  const fedRef = db.collection("federationGroups").doc(data.federationId);
  const fedSnap = await fedRef.get();

  if (!fedSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Federation not found.");
  }

  const fedData = fedSnap.data()!;
  if (fedData.memberPools.includes(data.poolId)) {
    throw new functions.https.HttpsError(
      "already-exists",
      "Pool is already a member of this federation."
    );
  }

  await fedRef.update({
    memberPools: admin.firestore.FieldValue.arrayUnion(data.poolId),
  });

  await logAudit({
    poolId: data.poolId,
    action: "FEDERATION_JOINED",
    performedBy: uid,
    targetResource: "federation",
    targetResourceId: data.federationId,
  });

  return { message: "Pool joined federation successfully." };
});

/**
 * Contribute to the federation's shared war chest.
 */
export const contributToWarChest = functions.https.onCall(
  async (data, context) => {
    const uid = requireAuth(context);
    validateRequired(data, ["federationId", "poolId", "amount"]);

    await requireFeature(data.poolId, "sharedWarChest");
    await requirePoolOwner(uid, data.poolId);

    if (typeof data.amount !== "number" || data.amount <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Amount must be a positive number."
      );
    }

    const fedRef = db.collection("federationGroups").doc(data.federationId);
    const ledgerRef = fedRef.collection("ledger").doc();

    await db.runTransaction(async (tx) => {
      const fedSnap = await tx.get(fedRef);
      if (!fedSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Federation not found.");
      }

      const currentBalance = fedSnap.data()?.sharedTreasuryBalance || 0;

      tx.update(fedRef, {
        sharedTreasuryBalance: currentBalance + data.amount,
      });

      tx.set(ledgerRef, {
        entryId: ledgerRef.id,
        federationId: data.federationId,
        poolId: data.poolId,
        type: "pool_contribution",
        amount: data.amount,
        description: data.description || "War chest contribution",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await logAudit({
      poolId: data.poolId,
      action: "FEDERATION_CONTRIBUTION",
      performedBy: uid,
      targetResource: "federation",
      targetResourceId: data.federationId,
      details: { amount: data.amount },
    });

    return { message: "Contribution to war chest recorded." };
  }
);

/**
 * Get federation overview with member pools and treasury.
 */
export const getFederationOverview = functions.https.onCall(
  async (data, context) => {
    const uid = requireAuth(context);
    validateRequired(data, ["federationId"]);

    const fedSnap = await db
      .collection("federationGroups")
      .doc(data.federationId)
      .get();

    if (!fedSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Federation not found.");
    }

    const fed = fedSnap.data()!;

    // Get ledger entries
    const ledgerSnap = await db
      .collection("federationGroups")
      .doc(data.federationId)
      .collection("ledger")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const ledger = ledgerSnap.docs.map((doc) => doc.data());

    // Get member pool details
    const poolPromises = fed.memberPools.map((poolId: string) =>
      db.collection("pools").doc(poolId).get()
    );
    const poolSnaps = await Promise.all(poolPromises);
    const memberPools = poolSnaps
      .filter((s) => s.exists)
      .map((s) => ({
        poolId: s.id,
        name: s.data()?.name,
        memberCount: s.data()?.memberCount,
      }));

    return {
      federation: {
        federationId: fed.federationId,
        title: fed.title,
        description: fed.description,
        governanceModel: fed.governanceModel,
        sharedTreasuryBalance: fed.sharedTreasuryBalance,
        memberPoolCount: fed.memberPools.length,
      },
      memberPools,
      recentLedger: ledger,
    };
  }
);
