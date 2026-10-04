"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function ClientLoginPage() {
  const router = useRouter();
  const { loginClient } = useProjectContext();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError("Enter your registered phone number and password.");
      return;
    }

    setError("");
    try {
      await loginClient(phone, password);
      router.replace("/client");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in. Check your phone and password.");
    }
  };

  return (
    <div className="role-login-shell client-login-shell">
      <div className="role-login-container client-surface">
        <div className="role-login-header client-header">
          <div className="role-icon">👤</div>
          <h1>Client</h1>
          <p>Access Your Photography Projects</p>
        </div>

        <form className="role-login-form" onSubmit={handleLogin}>
          <p className="form-intro">Sign in with the phone number and password registered to your client account.</p>

          <div className="form-group">
            <label htmlFor="client-phone">Phone Number</label>
            <input
              id="client-phone"
              type="tel"
              autoComplete="tel"
              minLength={7}
              maxLength={20}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your registered phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client-password">Password</label>
            <input
              id="client-password"
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
            Sign In
          </button>

        </form>
      </div>
    </div>
  );
}
