"use client";

import { TeamLoginPage } from "@/components/auth/TeamLoginPage";
import { TeamDashboard } from "@/components/team/TeamDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { PortalShell } from "@/components/common/PortalShell";

export default function TeamPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "team") {
    return <TeamLoginPage />;
  }

  return <PortalShell role="team"><TeamDashboard /></PortalShell>;
}
