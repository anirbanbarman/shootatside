import type { Project } from "@/types/project";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/utils/status";

interface ProjectTableProps {
  projects: Project[];
  onSelect: (projectId: string) => void;
}

export function ProjectTable({ projects, onSelect }: ProjectTableProps) {
  return (
    <div className="table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Client Name</th>
              <th>Event Type</th>
              <th>Event Date</th>
              <th>Quote Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td>{project.client.name}</td>
                <td>{project.eventType}</td>
                <td>{formatDate(project.eventDate)}</td>
                <td>{project.initialQuote ? formatCurrency(project.initialQuote.amount) : "—"}</td>
                <td>
                  <StatusBadge project={project} />
                </td>
                <td>
                  <button type="button" className="link-button" onClick={() => onSelect(project.id)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
