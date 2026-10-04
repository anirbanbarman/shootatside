"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function ClientLoginPage() {
  const router = useRouter();
  const { loginClient } = useProjectContext();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !phone.trim()) {
      setError("Enter both your registered email address and phone number.");
      return;
    }

    setError("");
    try {
      await loginClient(email, phone);
      router.replace("/client");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in. Check your registered email and phone number.");
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
          <p className="form-intro">First time here? Your client account is created with these details. Returning clients should use the same email and phone.</p>

          <div className="form-group">
            <label htmlFor="client-email">Email Address</label>
            <input
              id="client-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
            />
          </div>

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

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button full-width">
            Continue
          </button>

        </form>
      </div>
    </div>
  );
}
