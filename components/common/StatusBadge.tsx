import { getStatusLabel, getProjectStatus } from "@/utils/status";
import type { Project, ProjectStatus } from "@/types/project";

const statusStyles: Record<ProjectStatus, string> = {
  NEW_REQUEST: "badge badge-neutral",
  QUOTE_SENT: "badge badge-info",
  QUOTE_ACCEPTED: "badge badge-success",
  QUOTE_REJECTED: "badge badge-danger",
  NEGOTIATION_SENT: "badge badge-warning",
  NEGOTIATION_ACCEPTED: "badge badge-success",
  NEGOTIATION_REJECTED: "badge badge-danger",
  PROJECT_CONFIRMED: "badge badge-success",
};

export function StatusBadge({ project }: { project: Project }) {
  const status = getProjectStatus(project);

  return <span className={statusStyles[status]}>{getStatusLabel(status)}</span>;
}
