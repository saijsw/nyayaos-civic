import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Public Transparency Endpoint.
 * Returns public transparency data for a pool.
 * No authentication required.
 */
export const getPublicTransparency = functions.https.onRequest(async (req, res) => {
  const poolId = req.query.poolId as string;

  if (!poolId) {
    res.status(400).json({ error: "poolId query parameter required." });
    return;
  }

  const transSnap = await db.collection("transparency").doc(poolId).get();

  if (!transSnap.exists) {
    res.status(404).json({ error: "Transparency data not found for this pool." });
    return;
  }

  // Set CORS headers for public access
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "public, max-age=3600"); // Cache 1 hour

  res.status(200).json({
    data: transSnap.data(),
    generatedAt: new Date().toISOString(),
  });
});
