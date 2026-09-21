"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TeamRegistrationForm } from "@/components/auth/TeamRegistrationForm";

export function TeamLoginPage() {
  const router = useRouter();
  const { loginTeam } = useProjectContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    if (!loginTeam(username, password)) {
      setError("Your account is pending approval or the credentials are incorrect.");
      return;
    }

    router.replace("/team");
  };

  return (
    <div className="role-login-shell">
      <div className="role-login-container team-surface">
        <Link href="/" className="back-link">
          ← Back
        </Link>

        <div className="role-login-header team-header">
          <div className="role-icon">👥</div>
          <h1>Team Access</h1>
          <p>Team Collaboration Portal</p>
        </div>

        <div className="role-login-form">
          {showRegistration ? <>
            <p className="form-intro">Register below. Admin approval is required before event access is enabled.</p>
            <TeamRegistrationForm onComplete={() => setShowRegistration(false)} />
            <button type="button" className="secondary-button full-width" onClick={() => setShowRegistration(false)}>Back to Login</button>
          </> : <>
          <p className="form-intro">Use the username and password given to you after admin approval.</p>

          <div className="form-group">
            <label htmlFor="team-username">Username</label>
            <input
              id="team-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="team-password">Password</label>
            <input
              id="team-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="button" className="primary-button full-width" onClick={handleLogin}>
            Login to Team Portal
          </button>

          <button type="button" className="secondary-button full-width" onClick={() => setShowRegistration(true)}>Register as Team Member</button>
          </>}
        </div>
      </div>
    </div>
  );
}
