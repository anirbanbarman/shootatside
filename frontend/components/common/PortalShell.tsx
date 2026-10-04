"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { Box, Button, Collapse, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { usePathname } from "next/navigation";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import NextLinkAdapter from "@/components/common/NextLinkAdapter";

type PortalRole = "admin" | "client" | "team" | "editor";
type PortalIcon = typeof DashboardIcon;
type PortalLink = { href: string; label: string; icon: PortalIcon; children?: PortalLink[] };

const portalCopy: Record<PortalRole, { label: string; title: string; links: PortalLink[] }> = {
  admin: {
    label: "Admin",
    title: "Admin",
    links: [
      { href: "/admin", label: "Dashboard", icon: DashboardIcon },
      { href: "/admin/team/registrations", label: "Team Management", icon: GroupsIcon, children: [
        { href: "/admin/team/registrations", label: "Registrations", icon: AssignmentIndOutlinedIcon },
        { href: "/admin/team/interests", label: "Interest Requests", icon: FavoriteBorderIcon },
        { href: "/admin/team/hierarchy", label: "Team Builder", icon: AccountTreeOutlinedIcon },
        { href: "/admin/team/live-tracker", label: "Live Event Tracker", icon: EventNoteOutlinedIcon },
      ] },
      { href: "/admin/editing", label: "Editor Management", icon: EditNoteIcon },
    ],
  },
  client: {
    label: "Client",
    title: "Client",
    links: [{ href: "/client", label: "My Projects", icon: FolderOpenIcon }, { href: "/client/new-request", label: "New Request", icon: AddCircleOutlineIcon }],
  },
  team: {
    label: "Team",
    title: "Team",
    links: [{ href: "/team/events", label: "Available Events", icon: EventAvailableIcon }, { href: "/team/tracker", label: "Event Tracker", icon: ScheduleIcon }],
  },
  editor: {
    label: "Editor",
    title: "Editor",
    links: [{ href: "/editor", label: "Editing Jobs", icon: ContentCutIcon }],
  },
};

export function PortalShell({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { currentUser, logout } = useProjectContext();
  const copy = portalCopy[role];
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(pathname.startsWith("/admin/team") ? ["Team Management"] : []);

  const toggleMenu = (label: string) => setExpandedMenus((current) => current.includes(label)
    ? current.filter((item) => item !== label)
    : [...current, label]);

  const isActive = (href: string, hasChildren = false) => hasChildren
    ? pathname === href || pathname.startsWith("/admin/team/")
    : pathname === href;

  const renderNavigation = (mobile = false) => (
    <>
      <div className="portal-sidebar-label">Workspace</div>
      <Box component="nav" aria-label={`${copy.title} navigation`} className="portal-nav">
        <List disablePadding>{copy.links.map((link) => {
          const Icon = link.icon;
          const hasChildren = Boolean(link.children?.length);
          const expanded = expandedMenus.includes(link.label);
          return <Box key={link.label} className="portal-nav-group">
            <Box className="portal-nav-parent-row">
              <ListItemButton component={NextLinkAdapter} href={link.href} selected={isActive(link.href, hasChildren)} className="portal-nav-item" onClick={() => { if (hasChildren) setExpandedMenus((current) => current.includes(link.label) ? current : [...current, link.label]); if (mobile) setMobileNavOpen(false); }}>
                <ListItemIcon><Icon fontSize="small" /></ListItemIcon><ListItemText primary={link.label} />
              </ListItemButton>
              {hasChildren ? <IconButton size="small" className="portal-nav-expand" aria-label={`${expanded ? "Collapse" : "Expand"} ${link.label}`} aria-expanded={expanded} onClick={() => toggleMenu(link.label)}>{expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}</IconButton> : null}
            </Box>
            {hasChildren ? <Collapse in={expanded} timeout="auto" unmountOnExit><List disablePadding className="portal-subnav">{link.children?.map((child) => {
              const ChildIcon = child.icon;
              return <ListItemButton key={child.href} component={NextLinkAdapter} href={child.href} selected={isActive(child.href)} className="portal-nav-item portal-nav-child" onClick={() => { if (mobile) setMobileNavOpen(false); }}><ListItemIcon><ChildIcon fontSize="small" /></ListItemIcon><ListItemText primary={child.label} /></ListItemButton>;
            })}</List></Collapse> : null}
          </Box>;
        })}</List>
      </Box>
      <div className="portal-sidebar-note"><span>Studio Shoot at Sight</span><p>One calm place for every production detail.</p></div>
    </>
  );

  return (
    <div className={`portal-layout portal-layout-${role}`}>
      <Box component="header" className="portal-header">
        <IconButton className="portal-mobile-menu-button" aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)} color="inherit">{mobileNavOpen ? <CloseIcon /> : <MenuIcon />}</IconButton>
        <Link href="/" className="portal-brand"><span className="portal-brand-mark">S</span><span>Studio Shoot at Sight</span></Link>
        <div className="portal-user"><Typography component="span">{currentUser?.name ?? "Account"} ({role.charAt(0).toUpperCase() + role.slice(1)})</Typography><Button variant="outlined" color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout}>Log out</Button></div>
      </Box>

      <Box component="aside" className="portal-sidebar">
        {renderNavigation()}
      </Box>

      <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} className="portal-mobile-drawer" ModalProps={{ keepMounted: true }}>
        <Box className="portal-mobile-drawer-content" role="presentation">{renderNavigation(true)}</Box>
      </Drawer>

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
