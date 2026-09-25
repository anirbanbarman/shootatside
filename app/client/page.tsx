"use client";

import { ClientDashboard } from "@/components/client/ClientDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { ClientLoginPage } from "@/components/auth/ClientLoginPage";
import { PortalShell } from "@/components/common/PortalShell";

export default function ClientPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "client") {
    return <ClientLoginPage />;
  }

  return <PortalShell role="client"><ClientDashboard /></PortalShell>;
}
