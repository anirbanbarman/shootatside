"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, currentUser } = useProjectContext();
  const [email, setEmail] = useState("admin@ani.photography.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      router.push("/admin");
    }
  }, [currentUser, router]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    loginAdmin({
      name: "Ani Barman",
      email: email.trim(),
      phone: "8906349799",
    });
    router.push("/admin");
  };

  return (
    <div className="role-login-shell">
      <div className="role-login-container admin-surface">
        <Link href="/" className="back-link">
          ← Back
        </Link>

        <div className="role-login-header admin-header">
          <div className="role-icon">🔐</div>
          <h1>Admin Panel</h1>
          <p>Photography Management Dashboard</p>
        </div>

        <div className="role-login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ani.photography.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="button" className="primary-button full-width" onClick={handleLogin}>
            Login to Admin Panel
          </button>

          <div className="demo-note">
            <strong>Demo Credentials</strong>
            <p>Email: admin@ani.photography.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
