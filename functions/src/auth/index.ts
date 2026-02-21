import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Auth Trigger: On new user creation.
 * Creates a user document in Firestore with default role.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const userDoc = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    globalRole: "user",
    pools: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(user.uid).set(userDoc);
  functions.logger.info(`User document created for ${user.uid}`);
});

/**
 * Auth Trigger: On user deletion.
 * Cleans up user document (pool memberships handled separately).
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  await db.collection("users").doc(user.uid).delete();
  functions.logger.info(`User document deleted for ${user.uid}`);
});
