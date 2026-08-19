import type { Project } from "@/types/project";
import { formatCurrency, getProjectTimeline } from "@/utils/status";

function formatTimelineDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectTimeline({ project }: { project: Project }) {
  const entries = getProjectTimeline(project);

  return (
    <div className="timeline-wrap">
      {entries.map((entry, index) => (
        <div className="timeline-item" key={`${entry.title}-${index}`}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{entry.title}</strong>
            <div className="timeline-time">{formatTimelineDate(entry.timestamp)}</div>
            {entry.amount ? <div className="timeline-amount">{formatCurrency(entry.amount)}</div> : null}
            {entry.detail ? <p>{entry.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
