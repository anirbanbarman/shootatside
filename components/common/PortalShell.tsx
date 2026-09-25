"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

type PortalRole = "admin" | "client" | "team";

const portalCopy: Record<PortalRole, { label: string; title: string; links: { href: string; label: string }[] }> = {
  admin: {
    label: "Studio control",
    title: "Admin Portal",
    links: [{ href: "/admin", label: "Dashboard" }, { href: "/admin?section=registrations", label: "Team Management" }],
  },
  client: {
    label: "Your production desk",
    title: "Client Portal",
    links: [{ href: "/client", label: "My Projects" }, { href: "/client#requests", label: "New Request" }],
  },
  team: {
    label: "Field operations",
    title: "Team Portal",
    links: [{ href: "/team", label: "Available Events" }, { href: "/team#tracker", label: "Event Tracker" }],
  },
};

export function PortalShell({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { currentUser, logout } = useProjectContext();
  const copy = portalCopy[role];

  return (
    <div className={`portal-layout portal-layout-${role}`}>
      <header className="portal-header">
        <Link href="/" className="portal-brand"><span className="portal-brand-mark">S</span><span>Studio Shoot at Sight</span></Link>
        <div className="portal-header-context"><span>{copy.label}</span><strong>{copy.title}</strong></div>
        <div className="portal-user"><span>{currentUser?.name ?? "Guest"}</span><button type="button" className="portal-logout" onClick={logout}>Log out</button></div>
      </header>

      <aside className="portal-sidebar">
        <div className="portal-sidebar-label">Workspace</div>
        <nav aria-label={`${copy.title} navigation`} className="portal-nav">
          {copy.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </nav>
        <div className="portal-sidebar-note"><span>Studio Shoot at Sight</span><p>One calm place for every production detail.</p></div>
      </aside>

      <main className="portal-main">{children}</main>

      {role === "admin" ? null : <aside className="portal-aside">
        <div className="portal-aside-kicker">{role === "client" ? "Project pulse" : "On the ground"}</div>
        <h2>{role === "client" ? "Your story, in focus." : "Move with the day."}</h2>
        <p>{role === "client" ? "Quotes, bookings, call details, and your assigned lead live here." : "Your event details and team check-ins are organized around the shoot date."}</p>
        <div className="portal-aside-rule" />
        <span className="portal-aside-status">System status</span>
        <strong className="portal-aside-live">Local workspace active</strong>
      </aside>}

      <footer className="portal-footer"><span>Studio Shoot at Sight</span><span>© 2026 · Private workspace</span></footer>
    </div>
  );
}
