"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function ClientLoginPage() {
  const router = useRouter();
  const { loginClient } = useProjectContext();
  const [name, setName] = useState("Aisha Khan");
  const [email, setEmail] = useState("aisha.khan@example.com");
  const [phone, setPhone] = useState("+91 99887 66554");
  const [error, setError] = useState("");

  const handleLogin = () => {
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
    <div className="role-login-shell">
      <div className="role-login-container client-surface">
        <Link href="/" className="back-link">
          ← Back
        </Link>

        <div className="role-login-header client-header">
          <div className="role-icon">👤</div>
          <h1>Client Portal</h1>
          <p>Access Your Photography Projects</p>
        </div>

        <div className="role-login-form">
          <p className="form-intro">Enter your details to view your submitted requests and quotes.</p>

          <div className="form-group">
            <label htmlFor="client-name">Your Full Name</label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client-email">Email Address</label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client-phone">Phone Number</label>
            <input
              id="client-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="button" className="primary-button full-width" onClick={handleLogin}>
            Open My Portal
          </button>

          <div className="demo-note">
            <strong>Demo Client</strong>
            <p>Name: Aisha Khan</p>
            <p>Email: aisha.khan@example.com</p>
            <p>Phone: +91 99887 66554</p>
          </div>
        </div>
      </div>
    </div>
  );
}
