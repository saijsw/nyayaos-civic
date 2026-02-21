import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from 'config/firebase';
import { Pool } from 'services/poolService';

interface PoolContextType {
  currentPool: Pool | null;
  setCurrentPoolId: (id: string | null) => void;
  loading: boolean;
}

const PoolContext = createContext<PoolContextType>({
  currentPool: null,
  setCurrentPoolId: () => {},
  loading: false,
});

export const usePool = () => useContext(PoolContext);

export const PoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [poolId, setPoolId] = useState<string | null>(null);
  const [currentPool, setCurrentPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poolId) {
      setCurrentPool(null);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'pools', poolId), (snap) => {
      if (snap.exists()) {
        setCurrentPool({ id: snap.id, ...snap.data() } as Pool);
      } else {
        setCurrentPool(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [poolId]);

  return (
    <PoolContext.Provider value={{ currentPool, setCurrentPoolId: setPoolId, loading }}>
      {children}
    </PoolContext.Provider>
  );
};

export default PoolContext;
