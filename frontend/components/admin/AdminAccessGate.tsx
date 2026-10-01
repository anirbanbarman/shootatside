"use client";

import type { ReactNode } from "react";

import { AdminLoginPage } from "@/components/auth/AdminLoginPage";
import { PortalShell } from "@/components/common/PortalShell";
import { useProjectContext } from "@/components/providers/ProjectProvider";

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const { currentUser, isReady } = useProjectContext();
  if (!isReady) return null;
  if (!currentUser || currentUser.role !== "admin") return <AdminLoginPage />;
  return <PortalShell role="admin">{children}</PortalShell>;
}
