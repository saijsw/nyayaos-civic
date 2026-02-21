import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * Generic hook to subscribe to a Firestore collection query.
 */
export function useFirestoreQuery<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [path, enabled]);

  return { data, loading, error };
}

export { orderBy, limit, where };
