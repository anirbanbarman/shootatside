import { getStatusLabel, getProjectStatus } from "@/utils/status";
import type { Project, ProjectStatus } from "@/types/project";
import Chip from "@mui/material/Chip";

const statusColors: Record<ProjectStatus, "default" | "info" | "success" | "error" | "warning"> = {
  NEW_REQUEST: "default",
  QUOTE_SENT: "info",
  QUOTE_ACCEPTED: "success",
  QUOTE_REJECTED: "error",
  NEGOTIATION_SENT: "warning",
  NEGOTIATION_ACCEPTED: "success",
  NEGOTIATION_REJECTED: "error",
  PROJECT_CONFIRMED: "success",
};

export function StatusBadge({ project }: { project: Project }) {
  const status = getProjectStatus(project);

  return <Chip size="small" variant="outlined" color={statusColors[status]} label={getStatusLabel(status)} />;
}
