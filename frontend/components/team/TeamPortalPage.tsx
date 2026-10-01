"use client";

import { TeamLoginPage } from "@/components/auth/TeamLoginPage";
import { PortalShell } from "@/components/common/PortalShell";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TeamDashboard } from "@/components/team/TeamDashboard";

export function TeamPortalPage({ mode }: { mode: "events" | "tracker" }) {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) return null;
  if (!currentUser || currentUser.role !== "team") return <TeamLoginPage />;

  return <PortalShell role="team"><TeamDashboard mode={mode} /></PortalShell>;
}
