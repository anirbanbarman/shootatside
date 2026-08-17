"use client";

import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

export function LoginScreen() {
  const { loginAdmin, loginClient, loginTeam } = useProjectContext();
  const [mode, setMode] = useState<"admin" | "client" | "team">("admin");
  const [adminEmail, setAdminEmail] = useState("admin@ani.photography.com");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setError("Please enter your admin email and password.");
      return;
    }

    loginAdmin({
      name: "Ani Barman",
      email: adminEmail.trim(),
      phone: "8906349799",
    });
  };

  const handleClientLogin = () => {
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setError("Please enter your name, email, and phone to continue.");
      return;
    }

    loginClient({
      name: clientName.trim(),
      email: clientEmail.trim(),
      phone: clientPhone.trim(),
    });
  };

  const handleTeamLogin = () => {
    if (!teamName.trim() || !teamCode.trim()) {
      setError("Please enter your team name and access code.");
      return;
    }

    loginTeam({
      name: teamName.trim(),
      email: `${teamName.trim().toLowerCase().replace(/\s+/g, ".")}@team.ani`,
      phone: "team-access",
      code: teamCode.trim(),
    });
  };

  return (
    <div className="login-shell">
      <header className="login-header">
        <div className="login-brand">📷 Ani Photography</div>
        <div className="login-switcher">
          <button type="button" className={mode === "admin" ? "login-tab active" : "login-tab"} onClick={() => setMode("admin")}>
            Admin Panel
          </button>
          <button type="button" className={mode === "client" ? "login-tab active" : "login-tab"} onClick={() => setMode("client")}>
            Client Portal
          </button>
          <button type="button" className={mode === "team" ? "login-tab active" : "login-tab"} onClick={() => setMode("team")}>
            Team Login
          </button>
        </div>
      </header>

      <div className="login-card">
        {mode === "admin" ? (
          <>
            <div className="login-title">Admin Login</div>
            <p className="login-subtitle">Pre-filled admin access for the photography dashboard.</p>
            <div className="login-form">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />

              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />

              <button type="button" className="primary-button full-width" onClick={handleAdminLogin}>
                Login as Admin
              </button>
            </div>
          </>
        ) : null}

        {mode === "client" ? (
          <>
            <div className="login-title">Client Login</div>
            <p className="login-subtitle">Use your request details to view only your submitted projects.</p>
            <div className="login-form">
              <label htmlFor="client-name">Name</label>
              <input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />

              <label htmlFor="client-email">Email</label>
              <input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />

              <label htmlFor="client-phone">Phone</label>
              <input id="client-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />

              <button type="button" className="primary-button full-width" onClick={handleClientLogin}>
                Open My Portal
              </button>
            </div>
          </>
        ) : null}

        {mode === "team" ? (
          <>
            <div className="login-title">Team Login</div>
            <p className="login-subtitle">Use the team code shared by the admin when it is ready.</p>
            <div className="login-form">
              <label htmlFor="team-name">Team Member Name</label>
              <input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />

              <label htmlFor="team-code">Access Code</label>
              <input id="team-code" value={teamCode} onChange={(e) => setTeamCode(e.target.value)} />

              <button type="button" className="primary-button full-width" onClick={handleTeamLogin}>
                Login to Team Portal
              </button>
            </div>
          </>
        ) : null}

        {error ? <div className="error-box" style={{ marginTop: "18px" }}>{error}</div> : null}
      </div>
    </div>
  );
}
