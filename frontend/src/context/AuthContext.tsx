import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from 'config/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'member' | 'admin' | 'superAdmin';
  pools: string[];
  reputation: {
    score: number;
    contributionScore: number;
    votingParticipation: number;
    proposalAccuracy: number;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Listen to user profile changes in Firestore
  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      }
      setLoading(false);
    });
    return () => unsubProfile();
  }, [user]);

  const isSuperAdmin = profile?.role === 'superAdmin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
