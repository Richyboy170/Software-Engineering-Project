import React, { useState } from "react";
import { api } from "../api";
import { User } from "../types";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("quickorder_token", res.token);
      localStorage.setItem("quickorder_user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const loginPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div style={{
      maxWidth: 440,
      margin: "3rem auto",
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0"
    }}>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Sign In to QuickOrder</h2>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Deliverable 1 Working Sprint 1 Authentication
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "0.75rem 1rem",
          borderRadius: 8,
          fontSize: "0.875rem",
          marginBottom: "1.25rem"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e.g. customer@quickorder.local"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            backgroundColor: "#f97316",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      {/* TA / Demo Fast-Login Presets */}
      <div style={{
        marginTop: "2rem",
        paddingTop: "1.25rem",
        borderTop: "1px solid #f1f5f9"
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem", textAlign: "center" }}>
          Demo Evaluator Quick Fill
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => loginPreset("customer@quickorder.local")}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer"
            }}
          >
            👤 Customer Role
          </button>
          <button
            type="button"
            onClick={() => loginPreset("staff@quickorder.local")}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer"
            }}
          >
            🍳 Staff Role
          </button>
        </div>
      </div>
    </div>
  );
};
