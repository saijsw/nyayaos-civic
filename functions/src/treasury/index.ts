import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolAdmin, checkPoolNotFrozen } from "../middleware";
import { logAudit } from "../audit";
import { validateRequired, sanitize } from "../utils";

const db = admin.firestore();

/**
 * Record a treasury contribution (money coming in).
 * Creates an immutable ledger entry.
 */
export const recordContribution = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "amount", "description"]);

  await requirePoolAdmin(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  if (typeof data.amount !== "number" || data.amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount must be a positive number."
    );
  }

  return await db.runTransaction(async (tx) => {
    const poolRef = db.collection("pools").doc(data.poolId);
    const treasuryRef = poolRef.collection("treasury").doc();

    // Get current balance from the last transaction
    const lastTxSnap = await poolRef
      .collection("treasury")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let currentBalance = 0;
    if (!lastTxSnap.empty) {
      currentBalance = lastTxSnap.docs[0].data().balanceAfter || 0;
    }

    const newBalance = currentBalance + data.amount;

    tx.set(treasuryRef, {
      txId: treasuryRef.id,
      poolId: data.poolId,
      type: "contribution",
      amount: data.amount,
      currency: data.currency || "INR",
      description: sanitize(data.description),
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      balanceAfter: newBalance,
    });

    return { txId: treasuryRef.id, balanceAfter: newBalance };
  }).then(async (result) => {
    await logAudit({
      poolId: data.poolId,
      action: "TREASURY_CONTRIBUTION",
      performedBy: uid,
      targetResource: "treasury",
      targetResourceId: result.txId,
      details: { amount: data.amount, balanceAfter: result.balanceAfter },
    });

    // Update member's contribution score
    await db.collection("pools").doc(data.poolId)
      .collection("members").doc(uid)
      .update({
        contributionScore: admin.firestore.FieldValue.increment(1),
      });

    return { ...result, message: "Contribution recorded." };
  });
});

/**
 * Record a treasury expense (money going out).
 */
export const recordExpense = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId", "amount", "description"]);

  await requirePoolAdmin(uid, data.poolId);
  await checkPoolNotFrozen(data.poolId);

  if (typeof data.amount !== "number" || data.amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount must be a positive number."
    );
  }

  return await db.runTransaction(async (tx) => {
    const poolRef = db.collection("pools").doc(data.poolId);
    const treasuryRef = poolRef.collection("treasury").doc();

    const lastTxSnap = await poolRef
      .collection("treasury")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let currentBalance = 0;
    if (!lastTxSnap.empty) {
      currentBalance = lastTxSnap.docs[0].data().balanceAfter || 0;
    }

    if (data.amount > currentBalance) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Insufficient funds. Current balance: ${currentBalance}`
      );
    }

    const newBalance = currentBalance - data.amount;

    tx.set(treasuryRef, {
      txId: treasuryRef.id,
      poolId: data.poolId,
      type: "expense",
      amount: -data.amount,
      currency: data.currency || "INR",
      description: sanitize(data.description),
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      balanceAfter: newBalance,
    });

    return { txId: treasuryRef.id, balanceAfter: newBalance };
  }).then(async (result) => {
    await logAudit({
      poolId: data.poolId,
      action: "TREASURY_EXPENSE",
      performedBy: uid,
      targetResource: "treasury",
      targetResourceId: result.txId,
      details: { amount: data.amount, balanceAfter: result.balanceAfter },
    });
    return { ...result, message: "Expense recorded." };
  });
});

/**
 * Get treasury balance and recent transactions.
 */
export const getTreasuryOverview = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  validateRequired(data, ["poolId"]);

  // Members can view treasury
  const poolRef = db.collection("pools").doc(data.poolId);

  // Get last 20 transactions
  const txSnap = await poolRef
    .collection("treasury")
    .orderBy("createdAt", "desc")
    .limit(data.limit || 20)
    .get();

  const transactions = txSnap.docs.map((doc) => doc.data());
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : 0;

  // Calculate totals
  const allTxSnap = await poolRef.collection("treasury").get();
  let totalContributions = 0;
  let totalExpenses = 0;

  allTxSnap.docs.forEach((doc) => {
    const tx = doc.data();
    if (tx.type === "contribution") totalContributions += tx.amount;
    if (tx.type === "expense") totalExpenses += Math.abs(tx.amount);
  });

  return {
    currentBalance,
    totalContributions,
    totalExpenses,
    recentTransactions: transactions,
  };
});
