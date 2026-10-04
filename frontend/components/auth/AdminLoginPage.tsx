"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { trackedFetch } from "@/utils/apiActivity";

export function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useProjectContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const response = await trackedFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Invalid admin credentials.");
        return;
      }

      loginAdmin({
        name: data.user?.name ?? "Admin",
        email: data.user?.email ?? normalizedEmail,
        phone: data.user?.phone ?? "",
        role: "admin",
      });
      router.replace("/admin");
    } catch {
      setError("Unable to reach the backend. Please try again.");
    }
  };

  return (
    <div className="role-login-shell admin-login-shell">
      <div className="role-login-container admin-surface">
        <div className="role-login-header admin-header">
          <div className="role-icon">🔐</div>
          <h1>Admin</h1>
          <p>Photography Management Dashboard</p>
        </div>

        <form className="role-login-form" onSubmit={(event) => { event.preventDefault(); void handleLogin(); }}>
          <div className="form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button full-width">
            Login to Admin
          </button>
        </form>
      </div>
    </div>
  );
}
