import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Notification System
 * Stores in-app notifications for users.
 * Future: integrate with FCM, email, or push notifications.
 */

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "action" | "success";
  link?: string;
}): Promise<void> {
  await db.collection("users").doc(params.userId)
    .collection("notifications").doc().set({
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Get unread notifications for a user.
 */
export const getNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const notifsSnap = await db
    .collection("users")
    .doc(context.auth.uid)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(data?.limit || 20)
    .get();

  return {
    notifications: notifsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
});

/**
 * Mark a notification as read.
 */
export const markNotificationRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  if (!data?.notificationId) {
    throw new functions.https.HttpsError("invalid-argument", "notificationId required.");
  }

  await db
    .collection("users")
    .doc(context.auth.uid)
    .collection("notifications")
    .doc(data.notificationId)
    .update({ read: true });

  return { message: "Notification marked as read." };
});
