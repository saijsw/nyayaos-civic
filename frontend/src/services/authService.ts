import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from 'config/firebase';

const googleProvider = new GoogleAuthProvider();

/** Sign in with email & password */
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

/** Register with email & password, then create user doc */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserDocument(cred.user, displayName);
  return cred;
};

/** Sign in with Google OAuth popup */
export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(cred.user, cred.user.displayName || 'Anonymous');
  }
  return cred;
};

/** Sign out */
export const logout = () => signOut(auth);

/** Send password reset email */
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

/** Create Firestore user document on registration */
const createUserDocument = async (user: User, displayName: string) => {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    role: 'member',
    pools: [],
    createdAt: serverTimestamp(),
    reputation: { score: 0, contributionScore: 0, votingParticipation: 0, proposalAccuracy: 0 },
  });
};

/** Fetch user profile from Firestore */
export const getUserProfile = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
