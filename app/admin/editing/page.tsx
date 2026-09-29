import { EditorManagementPanel } from "@/components/admin/EditorManagementPanel";
import { AdminAccessGate } from "@/components/admin/AdminAccessGate";

export default function AdminEditingPage() {
  return <AdminAccessGate><EditorManagementPanel /></AdminAccessGate>;
}
