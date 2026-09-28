"use client";

import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { EditingChat } from "@/components/common/EditingChat";
import { formatDate } from "@/utils/status";
import { getEditingMilestones, getEditingProgress } from "@/utils/notifications";

export function EditorDashboard() {
  const { projects, currentUser, markEditorDownloadComplete, updateEditingMilestone, deliverEditedFiles } = useProjectContext();
  const [deliveryLinks, setDeliveryLinks] = useState<Record<string, string>>({});
  const completedEvents = projects.filter((project) => Boolean(project.eventTracker?.eventCompletedAt));
  const myJobs = completedEvents.filter((project) => project.editingWorkflow?.assignedEditorEmail === currentUser?.email);
  const availableJobs = completedEvents.filter((project) => !project.editingWorkflow?.assignedEditorEmail);

  return <div className="dashboard-shell editor-dashboard">
    <section className="page-intro"><div><p className="eyebrow">Editor Workspace</p><h2>Post-production</h2><p className="form-note">Completed events, assigned editing work, and delivery progress.</p></div><span className="pill">{myJobs.length} assigned jobs</span></section>
    <section className="panel">
      <div className="panel-header"><div><h3>Completed events</h3><p className="form-note">Events assigned to you appear in My Editing Jobs. Admin selects editors based on registered specialties.</p></div></div>
      {availableJobs.length ? <div className="editor-job-list">{availableJobs.map((project) => {
        return <article className="editor-job-card" key={project.id}><div><p className="eyebrow">{project.id}</p><h3>{project.client.name} · {project.eventType}</h3><p>{formatDate(project.eventDate)} · {project.venue}</p><span className="pill editor-completed-pill">Event Completed · {new Date(project.eventTracker?.eventCompletedAt ?? "").toLocaleString()}</span></div><span className="pill">Awaiting admin assignment</span></article>;
      })}</div> : <div className="empty-state">No unassigned completed events are available right now.</div>}
    </section>
    <section className="panel">
      <div className="panel-header"><div><h3>My Editing Jobs</h3><p className="form-note">Your assigned projects and current milestone progress.</p></div></div>
      {myJobs.length ? <div className="editor-job-list">{myJobs.map((project) => {
        const workflow = project.editingWorkflow!;
        const percent = getEditingProgress(workflow);
        const deliveryLink = deliveryLinks[project.id] ?? workflow.finalDriveUrl ?? "";
        return <article className="editor-job-card editor-job-assigned" key={project.id}>
          <div className="editor-job-heading"><div><p className="eyebrow">{project.id}</p><h3>{project.client.name} · {project.eventType}</h3><p>{formatDate(project.eventDate)}</p></div><span className="pill">{workflow.deliveredAt ? "Delivered" : workflow.downloadCompletedAt ? "Editing" : "Download required"}</span></div>
          {workflow.sourceDriveUrl ? <a className="editor-drive-link" href={workflow.sourceDriveUrl} target="_blank" rel="noreferrer">Open source files in Google Drive ↗</a> : <p className="warning-box">Admin has not added the source Drive link yet.</p>}
          {workflow.downloadCompletedAt ? <div className="success-box">Download completed · {new Date(workflow.downloadCompletedAt).toLocaleString()}</div> : workflow.sourceDriveUrl ? <button className="primary-button" type="button" onClick={() => markEditorDownloadComplete(project.id, currentUser?.email ?? "")}>Mark Download Completed</button> : null}
          {workflow.downloadCompletedAt ? workflow.adminTimeline ? <div className="editor-timeline"><strong>Admin editing timeline</strong><p>{workflow.adminTimeline}</p>{workflow.timelineDueDate ? <span>Target delivery: {formatDate(workflow.timelineDueDate)}</span> : null}</div> : <p className="form-note">Admin timeline will appear here when it is ready.</p> : <p className="form-note">The admin timeline will be released after you confirm the source download.</p>}
          <div className="editor-progress-head"><strong>Editing Progress</strong><b>{percent}%</b></div>
          <div className="editor-progress-track" role="progressbar" aria-label="Editing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
          <div className="editor-stage-list"><strong>Editor checklist</strong>{getEditingMilestones(workflow).map((milestone) => {
            const isCompleted = milestone.status === "COMPLETED";
            return <label className={`editor-stage-row editor-stage-check ${isCompleted ? "editor-stage-done" : ""}`} key={milestone.id}><input type="checkbox" disabled={!workflow.downloadCompletedAt} checked={isCompleted} onChange={(event) => updateEditingMilestone(project.id, currentUser?.email ?? "", milestone.id, event.target.checked ? "COMPLETED" : "NOT_STARTED")} /><span>{milestone.label}</span><strong>{isCompleted ? "Completed" : "Not completed"}</strong></label>;
          })}</div>
          {!workflow.downloadCompletedAt ? <p className="form-note">Your checklist is ready. Confirm the source download to start updating milestones.</p> : null}
          {workflow.downloadCompletedAt ? <div className="editor-delivery"><label htmlFor={`delivery-${project.id}`}>Final Google Drive link</label><input id={`delivery-${project.id}`} type="url" placeholder="https://drive.google.com/..." value={deliveryLink} onChange={(event) => setDeliveryLinks((current) => ({ ...current, [project.id]: event.target.value }))} /><button className="success-button" type="button" disabled={!deliveryLink.trim() || percent < 100} onClick={() => deliverEditedFiles(project.id, currentUser?.email ?? "", deliveryLink.trim())}>Mark Editing Complete &amp; Share</button>{percent < 100 ? <p className="form-note">Complete all {getEditingMilestones(workflow).length} milestones before sharing the final delivery.</p> : null}{workflow.deliveredAt ? <p className="success-box">Delivered to client · {new Date(workflow.deliveredAt).toLocaleString()}</p> : null}</div> : null}
          <EditingChat projectId={project.id} />
        </article>;
      })}</div> : <div className="empty-state">No editing jobs have been assigned to you.</div>}
    </section>
  </div>;
}