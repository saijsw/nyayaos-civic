import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Immutable Audit Logger
 * Writes an audit log entry that can never be modified or deleted.
 * Firestore rules enforce immutability — only Cloud Functions can write.
 */
export async function logAudit(params: {
  poolId: string;
  action: string;
  performedBy: string;
  targetResource: string;
  targetResourceId: string;
  details?: Record<string, any>;
}): Promise<string> {
  const logRef = db
    .collection("pools")
    .doc(params.poolId)
    .collection("auditLogs")
    .doc();

  await logRef.set({
    logId: logRef.id,
    poolId: params.poolId,
    action: params.action,
    performedBy: params.performedBy,
    targetResource: params.targetResource,
    targetResourceId: params.targetResourceId,
    details: params.details || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    immutable: true,
  });

  return logRef.id;
}
