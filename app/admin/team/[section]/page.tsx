import { notFound } from "next/navigation";

import { AdminAccessGate } from "@/components/admin/AdminAccessGate";
import { TeamManagementPanel } from "@/components/admin/AdminDashboard";

const teamSections = ["registrations", "interests", "hierarchy", "live-tracker"] as const;

export function generateStaticParams() {
  return teamSections.map((section) => ({ section }));
}

export default async function AdminTeamSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!teamSections.includes(section as (typeof teamSections)[number])) notFound();

  return <AdminAccessGate><TeamManagementPanel /></AdminAccessGate>;
}
