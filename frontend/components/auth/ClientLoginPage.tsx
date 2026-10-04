"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function ClientLoginPage() {
  const router = useRouter();
  const { loginClient } = useProjectContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please enter your name, email, and phone to continue.");
      return;
    }

    loginClient({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    router.replace("/client");
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
          <p className="form-intro">Enter your details to view your submitted requests and quotes.</p>

          <div className="form-group">
            <label htmlFor="client-name">Your Full Name</label>
            <input
              id="client-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client-email">Email Address</label>
            <input
              id="client-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              placeholder="Enter your phone number"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button full-width">
            Open My Portal
          </button>

        </form>
      </div>
    </div>
  );
}
