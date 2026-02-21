import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { logout } from "../../services/auth";

export default function Navbar() {
  const { user, isSuperAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav style={{
      background: "var(--primary)",
      color: "white",
      padding: "0.75rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ color: "white", fontWeight: 700, fontSize: "1.1rem" }}>
        ⚖️ NyayaOS Civic
      </Link>

      <div className="flex items-center gap-2">
        {user && (
          <>
            <Link to="/dashboard" style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" }}>
              Dashboard
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" style={{ color: "#fbd38d", fontSize: "0.9rem" }}>
                Admin
              </Link>
            )}
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              {unreadCount > 0 && `🔔 ${unreadCount}`}
            </span>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              {user.displayName}
            </span>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", padding: "0.3rem 0.75rem" }}
            >
              Logout
            </button>
          </>
        )}
        {!user && (
          <Link to="/login" className="btn btn-accent">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
