"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Box, Button, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePathname } from "next/navigation";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import NextLinkAdapter from "@/components/common/NextLinkAdapter";

type PortalRole = "admin" | "client" | "team" | "editor";
type PortalIcon = typeof DashboardIcon;

const portalCopy: Record<PortalRole, { label: string; title: string; links: { href: string; label: string; icon: PortalIcon }[] }> = {
  admin: {
    label: "Studio control",
    title: "Admin Portal",
    links: [{ href: "/admin", label: "Dashboard", icon: DashboardIcon }, { href: "/admin/team?section=registrations", label: "Team Management", icon: GroupsIcon }, { href: "/admin/editing", label: "Editor Management", icon: EditNoteIcon }],
  },
  client: {
    label: "Your production desk",
    title: "Client Portal",
    links: [{ href: "/client", label: "My Projects", icon: FolderOpenIcon }, { href: "/client#requests", label: "New Request", icon: AddCircleOutlineIcon }],
  },
  team: {
    label: "Field operations",
    title: "Team Portal",
    links: [{ href: "/team", label: "Available Events", icon: EventAvailableIcon }, { href: "/team#tracker", label: "Event Tracker", icon: ScheduleIcon }],
  },
  editor: {
    label: "Post-production studio",
    title: "Editor Dashboard",
    links: [{ href: "/editor", label: "Editing Jobs", icon: ContentCutIcon }],
  },
};

export function PortalShell({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { currentUser, logout } = useProjectContext();
  const copy = portalCopy[role];
  const pathname = usePathname();

  return (
    <div className={`portal-layout portal-layout-${role}`}>
      <Box component="header" className="portal-header">
        <Link href="/" className="portal-brand"><span className="portal-brand-mark">S</span><span>Studio Shoot at Sight</span></Link>
        <div className="portal-header-context"><Typography variant="overline">{copy.label}</Typography><Typography variant="h6" component="strong">{copy.title}</Typography></div>
        <div className="portal-user"><Typography component="span">{currentUser?.name ?? "Account"}</Typography><Button variant="outlined" color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout}>Log out</Button></div>
      </Box>

      <Box component="aside" className="portal-sidebar">
        <div className="portal-sidebar-label">Workspace</div>
        <Box component="nav" aria-label={`${copy.title} navigation`} className="portal-nav">
          <List disablePadding>{copy.links.map((link) => { const Icon = link.icon; const route = link.href.split("?")[0]; const active = pathname === route || (route !== "/admin" && pathname.startsWith(`${route}/`)); return <ListItemButton key={link.href} component={NextLinkAdapter} href={link.href} selected={active} className="portal-nav-item"><ListItemIcon><Icon fontSize="small" /></ListItemIcon><ListItemText primary={link.label} /></ListItemButton>; })}</List>
        </Box>
        <div className="portal-sidebar-note"><span>Studio Shoot at Sight</span><p>One calm place for every production detail.</p></div>
      </Box>

      <Box component="main" className="portal-main">{children}</Box>

      {role === "admin" || role === "team" || role === "client" ? null : <Box component="aside" className="portal-aside">
        <div className="portal-aside-kicker">Post-production</div>
        <h2>Shape the final story.</h2>
        <p>Download source files, follow the studio timeline, and share delivery progress.</p>
        <div className="portal-aside-rule" />
        <span className="portal-aside-status">System status</span>
        <strong className="portal-aside-live">Local workspace active</strong>
      </Box>}

      <Box component="footer" className="portal-footer"><span>Studio Shoot at Sight</span><span>© 2026 · Private workspace</span></Box>
    </div>
  );
}
