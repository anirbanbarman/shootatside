"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TeamRegistrationForm } from "@/components/auth/TeamRegistrationForm";
import { EDITING_ROLES } from "@/types/project";

export function TeamLoginPage() {
  const router = useRouter();
  const { loginTeam, teamRegistrations } = useProjectContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [error, setError] = useState("");
  const [editorPortalSuggested, setEditorPortalSuggested] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      await loginTeam(username, password);
      router.replace("/team");
    } catch {
      const editorAccount = teamRegistrations.find((registration) => registration.status === "ACCEPTED"
        && registration.username === username.trim()
        && registration.preferredRoles.some((role) => EDITING_ROLES.includes(role as (typeof EDITING_ROLES)[number])));
      setEditorPortalSuggested(Boolean(editorAccount));
      setError(editorAccount
        ? "Your registration includes an editing specialty. Please sign in to the Editor Workspace at /editor."
        : "Your account is pending approval or the credentials are incorrect.");
    }
  };

  return (
    <div className="role-login-shell team-login-shell">
      <div className="role-login-container team-surface">
        <div className="role-login-header team-header">
          <div className="role-icon">👥</div>
          <h1>Team</h1>
          <p>Team Collaboration Portal</p>
        </div>

        <div className="role-login-form">
          {showRegistration ? <>
            <p className="form-intro">Register below. Admin approval is required before event access is enabled.</p>
            <TeamRegistrationForm />
          </> : <>
          <p className="form-intro">Use the username and password given to you after admin approval.</p>

          <form className="team-login-form" onSubmit={(event) => { void handleLogin(event); }}>
          <div className="form-group">
            <label htmlFor="team-username">Username</label>
            <input
              id="team-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="team-password">Password</label>
            <input
              id="team-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error ? <div className="error-box">{error}{editorPortalSuggested ? <> <Link href="/editor">Open Editor Workspace</Link></> : null}</div> : null}

          <button type="submit" className="primary-button full-width">
            Login to Team
          </button>

          <Link href="/editor" className="secondary-button full-width editor-link-button">
            Open Editor Workspace
          </Link>

          <button type="button" className="secondary-button full-width" onClick={() => setShowRegistration(true)}>Register as Team Member</button>
          </form>
          </>}
        </div>
      </div>
    </div>
  );
}
