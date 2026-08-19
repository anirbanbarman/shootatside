"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { AdminLoginPage } from "@/components/auth/AdminLoginPage";

export default function AdminPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <AdminLoginPage />;
  }

  return (
    <main className="content-panel app-shell-main">
      <AdminDashboard />
    </main>
  );
}
