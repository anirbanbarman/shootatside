"use client";

import { TeamLoginPage } from "@/components/auth/TeamLoginPage";
import { TeamDashboard } from "@/components/team/TeamDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";

export default function TeamPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "team") {
    return <TeamLoginPage />;
  }

  return (
    <main className="content-panel app-shell-main">
      <TeamDashboard />
    </main>
  );
}
