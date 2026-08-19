"use client";

import { ClientDashboard } from "@/components/client/ClientDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { ClientLoginPage } from "@/components/auth/ClientLoginPage";

export default function ClientPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "client") {
    return <ClientLoginPage />;
  }

  return (
    <main className="content-panel app-shell-main">
      <ClientDashboard />
    </main>
  );
}
