import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail, loginWithGoogle } from "../../services/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
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
      setError(err.message || "Google sign-up failed.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: "4rem" }}>
      <div className="card">
        <h2 className="text-center mb-2">Create Account</h2>
        {error && (
          <div style={{ background: "#fed7d7", color: "#9b2c2c", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div className="mb-2">
            <label className="label">Display Name</label>
            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <div className="text-center mt-2">
          <button onClick={handleGoogle} className="btn btn-outline" style={{ width: "100%" }}>
            🔵 Sign up with Google
          </button>
        </div>
        <p className="text-center text-muted text-sm mt-2">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
