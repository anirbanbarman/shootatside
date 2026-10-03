import type { Project } from "@/types/project";

export function sortProjectsByDate(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
}

export function getProjectAmount(project: Project): number {
  if (project.negotiation) {
    return project.negotiation.amount;
  }

  if (project.initialQuote) {
    return project.initialQuote.amount;
  }

  return 0;
}
