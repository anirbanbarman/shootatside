"use client";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { ProjectTable } from "@/components/common/ProjectTable";

export function TeamDashboard() {
  const { projects, setSelectedProjectId } = useProjectContext();

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Team Portal</p>
          <h2>Team Access</h2>
        </div>
      </section>

      <div className="panel">
        <div className="panel-header space-between">
          <h3>Project Overview</h3>
          <span className="pill">{projects.length} total requests</span>
        </div>
        <ProjectTable projects={projects} onSelect={setSelectedProjectId} />
      </div>
    </div>
  );
}
