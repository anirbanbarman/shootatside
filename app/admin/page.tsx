"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { AdminLoginPage } from "@/components/auth/AdminLoginPage";
import { PortalShell } from "@/components/common/PortalShell";

export default function AdminPage() {
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) {
    return null;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <AdminLoginPage />;
  }

  return <PortalShell role="admin"><AdminDashboard /></PortalShell>;
}
