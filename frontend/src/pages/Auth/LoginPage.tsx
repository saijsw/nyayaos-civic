import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: "4rem" }}>
      <div className="card">
        <h2 className="text-center mb-2">Login to NyayaOS</h2>
        {error && (
          <div style={{ background: "#fed7d7", color: "#9b2c2c", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-2">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-center mt-2">
          <button onClick={handleGoogle} className="btn btn-outline" style={{ width: "100%" }}>
            🔵 Sign in with Google
          </button>
        </div>
        <p className="text-center text-muted text-sm mt-2">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
