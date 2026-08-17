import type { Project } from "@/types/project";
import { formatCurrency, getProjectTimeline } from "@/utils/status";

export function ProjectTimeline({ project }: { project: Project }) {
  const entries = getProjectTimeline(project);

  return (
    <div className="timeline-wrap">
      {entries.map((entry, index) => (
        <div className="timeline-item" key={`${entry.title}-${index}`}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{entry.title}</strong>
            {entry.amount ? <div className="timeline-amount">{formatCurrency(entry.amount)}</div> : null}
            {entry.detail ? <p>{entry.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
