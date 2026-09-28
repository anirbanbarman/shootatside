"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

type PortalRole = "admin" | "client" | "team" | "editor";

const portalCopy: Record<PortalRole, { label: string; title: string; links: { href: string; label: string; icon: string }[] }> = {
  admin: {
    label: "Studio control",
    title: "Admin Portal",
    links: [{ href: "/admin", label: "Dashboard", icon: "⌂" }, { href: "/admin?section=registrations", label: "Team Management", icon: "♙" }, { href: "/admin?section=editing", label: "Editor Management", icon: "✂" }],
  },
  client: {
    label: "Your production desk",
    title: "Client Portal",
    links: [{ href: "/client", label: "My Projects", icon: "▦" }, { href: "/client#requests", label: "New Request", icon: "+" }],
  },
  team: {
    label: "Field operations",
    title: "Team Portal",
    links: [{ href: "/team", label: "Available Events", icon: "◈" }, { href: "/team#tracker", label: "Event Tracker", icon: "◷" }],
  },
  editor: {
    label: "Post-production studio",
    title: "Editor Dashboard",
    links: [{ href: "/editor", label: "Editing Jobs", icon: "✂" }],
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
        <div className="portal-user"><span>{currentUser?.name ?? "Account"}</span><button type="button" className="portal-logout" onClick={logout}><span aria-hidden="true">↪</span> Log out</button></div>
      </header>

      <aside className="portal-sidebar">
        <div className="portal-sidebar-label">Workspace</div>
        <nav aria-label={`${copy.title} navigation`} className="portal-nav">
          {copy.links.map((link) => <Link href={link.href} key={link.href}><span className="portal-nav-icon" aria-hidden="true">{link.icon}</span><span>{link.label}</span></Link>)}
        </nav>
        <div className="portal-sidebar-note"><span>Studio Shoot at Sight</span><p>One calm place for every production detail.</p></div>
      </aside>

      <main className="portal-main">{children}</main>

      {role === "admin" || role === "team" || role === "client" ? null : <aside className="portal-aside">
        <div className="portal-aside-kicker">Post-production</div>
        <h2>Shape the final story.</h2>
        <p>Download source files, follow the studio timeline, and share delivery progress.</p>
        <div className="portal-aside-rule" />
        <span className="portal-aside-status">System status</span>
        <strong className="portal-aside-live">Local workspace active</strong>
      </aside>}

      <footer className="portal-footer"><span>Studio Shoot at Sight</span><span>© 2026 · Private workspace</span></footer>
    </div>
  );
}
