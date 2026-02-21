import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container" style={{ marginTop: "1.5rem", maxWidth: 600 }}>
      <h1 className="mb-2">Profile</h1>
      <div className="card">
        <div className="grid-2">
          <div>
            <p className="text-sm text-muted">Display Name</p>
            <p className="font-bold">{user.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Email</p>
            <p className="font-bold">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Role</p>
            <p className="font-bold">{user.globalRole}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Pools</p>
            <p className="font-bold">{user.pools?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
