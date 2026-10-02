"use client";

import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { trackedFetch } from "@/utils/apiActivity";

export function LoginScreen() {
  const { loginAdmin, loginClient, loginTeam } = useProjectContext();
  const [mode, setMode] = useState<"admin" | "client" | "team">("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [teamUsername, setTeamUsername] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      const response = await trackedFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Invalid admin credentials.");
        return;
      }

      loginAdmin({
        name: data.user?.name ?? "Admin",
        email: data.user?.email ?? adminEmail.trim(),
        phone: data.user?.phone ?? "",
        role: "admin",
      });
    } catch {
      setError("Unable to reach the backend. Please try again.");
    }
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
    if (!teamUsername.trim() || !teamPassword.trim()) {
      setError("Please enter your team username and password.");
      return;
    }

    if (!loginTeam(teamUsername, teamPassword)) {
      setError("Your account is pending approval or the credentials are incorrect.");
      return;
    }
  };

  return (
    <div className="login-shell">
      <header className="login-header">
        <div className="login-brand">📷 Studio Shoot at Sight</div>
        <div className="login-switcher">
          <button type="button" className={mode === "admin" ? "login-tab active" : "login-tab"} onClick={() => setMode("admin")}>
            Admin
          </button>
          <button type="button" className={mode === "client" ? "login-tab active" : "login-tab"} onClick={() => setMode("client")}>
            Client
          </button>
          <button type="button" className={mode === "team" ? "login-tab active" : "login-tab"} onClick={() => setMode("team")}>
            Team
          </button>
        </div>
      </header>

      <div className="login-card">
        {mode === "admin" ? (
          <>
            <div className="login-title">Admin Login</div>
            <p className="login-subtitle">Use your admin email and password to access the dashboard.</p>
            <div className="login-form">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Enter your email" />

              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Enter your password" />

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
              <input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter your name" />

              <label htmlFor="client-email">Email</label>
              <input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Enter your email" />

              <label htmlFor="client-phone">Phone</label>
              <input id="client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Enter your phone number" />

              <button type="button" className="primary-button full-width" onClick={handleClientLogin}>
                Open My Portal
              </button>
            </div>
          </>
        ) : null}

        {mode === "team" ? (
          <>
            <div className="login-title">Team</div>
            <p className="login-subtitle">Use the team code shared by the admin when it is ready.</p>
            <div className="login-form">
              <label htmlFor="team-username">Username</label>
              <input id="team-username" value={teamUsername} onChange={(e) => setTeamUsername(e.target.value)} />

              <label htmlFor="team-password">Password</label>
              <input id="team-password" type="password" value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} />

              <button type="button" className="primary-button full-width" onClick={handleTeamLogin}>
                Login to Team
              </button>
            </div>
          </>
        ) : null}

        {error ? <div className="error-box" style={{ marginTop: "18px" }}>{error}</div> : null}
      </div>
    </div>
  );
}
