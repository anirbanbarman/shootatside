"use client";

import { EditorLoginPage } from "@/components/auth/EditorLoginPage";
import { PortalShell } from "@/components/common/PortalShell";
import { EditorDashboard } from "@/components/editor/EditorDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";

export default function EditorPage() {
  const { currentUser, isReady } = useProjectContext();
  if (!isReady) return null;
  if (!currentUser || currentUser.role !== "editor") return <EditorLoginPage />;
  return <PortalShell role="editor"><EditorDashboard /></PortalShell>;
}
