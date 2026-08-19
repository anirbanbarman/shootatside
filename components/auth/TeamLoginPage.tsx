"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function TeamLoginPage() {
  const router = useRouter();
  const { loginTeam } = useProjectContext();
  const [name, setName] = useState("Aman Roy");
  const [code, setCode] = useState("TEAM-2026");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!name.trim() || !code.trim()) {
      setError("Please enter your team member name and access code.");
      return;
    }

    loginTeam({
      name: name.trim(),
      email: `${name.trim().toLowerCase().replace(/\s+/g, ".")}@team.ani`,
      phone: "team-access",
      code: code.trim(),
    });
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
          <p className="form-intro">Access the team portal with your credentials shared by the admin.</p>

          <div className="form-group">
            <label htmlFor="team-name">Team Member Name</label>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="team-code">Access Code</label>
            <input
              id="team-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your access code"
            />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="button" className="primary-button full-width" onClick={handleLogin}>
            Login to Team Portal
          </button>

          <div className="demo-note">
            <strong>Demo Access</strong>
            <p>Name: Aman Roy</p>
            <p>Code: TEAM-2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
