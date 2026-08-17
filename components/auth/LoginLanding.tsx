"use client";

import Link from "next/link";

export function LoginLanding() {
  return (
    <div className="landing-shell">
      <div className="landing-header">
        <div className="landing-logo">📷</div>
        <h1>Ani Photography</h1>
        <p>Quote & Negotiation Platform</p>
      </div>

      <div className="landing-cards">
        <Link href="/login/admin" className="landing-card admin-card">
          <div className="card-icon">🔐</div>
          <h2>Admin Panel</h2>
          <p>Manage quotes, negotiations, and projects</p>
          <div className="card-cta">Login to Admin</div>
        </Link>

        <Link href="/login/client" className="landing-card client-card">
          <div className="card-icon">👤</div>
          <h2>Client Portal</h2>
          <p>View your requests, quotes, and bookings</p>
          <div className="card-cta">Login to Client</div>
        </Link>

        <Link href="/login/team" className="landing-card team-card">
          <div className="card-icon">👥</div>
          <h2>Team Access</h2>
          <p>Access team collaboration portal</p>
          <div className="card-cta">Login to Team</div>
        </Link>
      </div>
    </div>
  );
}
