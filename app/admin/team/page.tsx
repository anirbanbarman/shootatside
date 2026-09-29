import { AdminAccessGate } from "@/components/admin/AdminAccessGate";
import { TeamManagementPanel } from "@/components/admin/AdminDashboard";

export default function AdminTeamPage() {
  return <AdminAccessGate><TeamManagementPanel /></AdminAccessGate>;
}
