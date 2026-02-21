import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "action" | "success";
  read: boolean;
  createdAt: any;
}

export function useNotifications(maxItems = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return unsub;
  }, [user?.uid, maxItems]);

  return { notifications, unreadCount };
}
