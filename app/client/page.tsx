"use client";

import { ClientDashboard } from "@/components/client/ClientDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { ClientLoginPage } from "@/components/auth/ClientLoginPage";

export default function ClientPage() {
  const { currentUser } = useProjectContext();

  if (!currentUser) {
    return <ClientLoginPage />;
  }

  return (
    <main className="content-panel app-shell-main">
      <ClientDashboard />
    </main>
  );
}
