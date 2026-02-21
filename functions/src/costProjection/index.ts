import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, requirePoolAdmin, requireFeature } from "../middleware";
import { validateRequired, sanitize } from "../utils";

const db = admin.firestore();

/**
 * Cost Projection Engine — Rule-based legal cost estimator.
 * Pro tier only.
 *
 * Uses case type, court level, and estimated duration to project costs.
 * This is a simplified model; real-world implementations would use
 * historical data and ML models.
 */

// Base cost multipliers by court level (in INR)
const COURT_BASE_COSTS: Record<string, number> = {
  district: 25000,
  high_court: 75000,
  supreme_court: 200000,
  tribunal: 15000,
  consumer_forum: 10000,
};

// Case type multipliers
const CASE_TYPE_MULTIPLIERS: Record<string, number> = {
  civil: 1.0,
  criminal: 1.5,
  property: 1.3,
  family: 0.8,
  labor: 0.9,
  consumer: 0.7,
  constitutional: 2.0,
  environmental: 1.4,
  tax: 1.6,
  corporate: 1.8,
};

// Monthly burn rate by court level
const MONTHLY_COSTS: Record<string, number> = {
  district: 8000,
  high_court: 20000,
  supreme_court: 50000,
  tribunal: 5000,
  consumer_forum: 3000,
};

/**
 * Generate a cost projection for a case.
 */
export const generateCostProjection = functions.https.onCall(
  async (data, context) => {
    const uid = requireAuth(context);
    validateRequired(data, ["poolId", "caseType", "courtLevel", "estimatedDurationMonths"]);

    await requirePoolAdmin(uid, data.poolId);
    await requireFeature(data.poolId, "costProjection");

    const caseType = data.caseType.toLowerCase();
    const courtLevel = data.courtLevel.toLowerCase();
    const duration = Number(data.estimatedDurationMonths);

    if (duration <= 0 || duration > 120) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Duration must be between 1 and 120 months."
      );
    }

    const baseCost = COURT_BASE_COSTS[courtLevel] || 25000;
    const typeMultiplier = CASE_TYPE_MULTIPLIERS[caseType] || 1.0;
    const monthlyCost = MONTHLY_COSTS[courtLevel] || 8000;

    // Calculate breakdown
    const filingFee = Math.round(baseCost * 0.15 * typeMultiplier);
    const lawyerFee = Math.round(baseCost * typeMultiplier + monthlyCost * duration);
    const courtFees = Math.round(baseCost * 0.1 * typeMultiplier);
    const documentationFee = Math.round(duration * 2000);
    const contingency = Math.round((filingFee + lawyerFee + courtFees + documentationFee) * 0.1);

    const projectedCost = filingFee + lawyerFee + courtFees + documentationFee + contingency;

    const breakdown = [
      { category: "filing_fee", amount: filingFee, notes: "Court filing charges" },
      { category: "lawyer_fee", amount: lawyerFee, notes: "Legal representation" },
      { category: "court_fees", amount: courtFees, notes: "Court processing fees" },
      { category: "documentation", amount: documentationFee, notes: "Document preparation & notarization" },
      { category: "contingency", amount: contingency, notes: "10% contingency buffer" },
    ];

    // Store projection
    const projRef = db.collection("pools").doc(data.poolId)
      .collection("cases").doc(data.caseId || "standalone")
      .collection("projections").doc();

    const projection = {
      projectionId: projRef.id,
      poolId: data.poolId,
      caseId: data.caseId || null,
      caseType,
      courtLevel,
      estimatedDurationMonths: duration,
      projectedCost,
      breakdown,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await projRef.set(projection);

    return {
      projectionId: projRef.id,
      projectedCost,
      breakdown,
      message: "Cost projection generated.",
    };
  }
);
