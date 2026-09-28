"use client";

import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { EditingChat } from "@/components/common/EditingChat";
import type { EditingMilestone } from "@/types/project";
import { formatDate } from "@/utils/status";
import { getEditingMilestones, getEditingProgress, getWhatsAppUrl } from "@/utils/notifications";

export function EditorManagementPanel() {
  const { projects, editors, assignEditor, updateEditingSetup } = useProjectContext();
  const [setup, setSetup] = useState<Record<string, { sourceDriveUrl: string; adminTimeline: string; timelineDueDate: string; milestones: EditingMilestone[] }>>({});
  const completedProjects = projects.filter((project) => project.eventTracker?.eventCompletedAt);

  return (
    <div className="dashboard-shell editor-admin-dashboard">
      <section className="page-intro">
        <div><p className="eyebrow">Post-production</p><h2>Editor Management</h2><p className="form-note">Assign a registered editor by their selected specialty, then publish source links and deadlines.</p></div>
        <span className="pill">{editors.length} editor accounts</span>
      </section>

      <section className="panel">
        <div className="panel-header"><div><h3>Completed Events · Editor Workflow</h3><p className="form-note">Choose the editor directly for each completed event. Editors do not request jobs.</p></div></div>
        {completedProjects.length ? <div className="editor-admin-job-list">{completedProjects.map((project) => {
          const workflow = project.editingWorkflow ?? { stageProgress: {} };
          const fields = setup[project.id] ?? { sourceDriveUrl: workflow.sourceDriveUrl ?? "", adminTimeline: workflow.adminTimeline ?? "", timelineDueDate: workflow.timelineDueDate ?? "", milestones: getEditingMilestones(workflow) };
          const assignedEditor = editors.find((editor) => editor.email === workflow.assignedEditorEmail);
          const eligibleEditors = editors.filter((editor) => editor.editingRoles?.length);
          const editingProgress = getEditingProgress(workflow);
          const clientCompletionMessage = `Hello ${project.client.name}, your ${project.eventType} event on ${formatDate(project.eventDate)} has been completed. Our post-production team will now prepare your edits.`;
          const clientTimelineMessage = `Hello ${project.client.name}, your editing timeline for ${project.eventType} is ready: ${workflow.adminTimeline || "Please check your client dashboard for the timeline."}${workflow.timelineDueDate ? ` Target delivery: ${formatDate(workflow.timelineDueDate)}.` : ""}`;

          return <article className="editor-admin-job" key={project.id}>
            <div className="editor-job-heading">
              <div><p className="eyebrow">{project.id}</p><h3>{project.client.name} · {project.eventType}</h3><p>{formatDate(project.eventDate)} · completed {new Date(project.eventTracker?.eventCompletedAt ?? "").toLocaleString()}</p></div>
              <span className="pill">{assignedEditor ? `Assigned: ${assignedEditor.name}` : "Editor unassigned"}</span>
            </div>

            <div className="notification-actions">
              {getWhatsAppUrl(project.client.phone, clientCompletionMessage) ? <a className="secondary-button" href={getWhatsAppUrl(project.client.phone, clientCompletionMessage) ?? undefined} target="_blank" rel="noreferrer">WhatsApp client · Event complete</a> : <span className="form-note">Client phone is unavailable for WhatsApp.</span>}
              {editors.filter((editor) => editor.editingRoles?.length).map((editor) => {
                const editorMessage = `New completed editing job available: ${project.eventType} for ${project.client.name} (${formatDate(project.eventDate)}). Admin will assign an editor based on registered editing specialties.`;
                const url = getWhatsAppUrl(editor.phone, editorMessage);
                return url ? <a className="secondary-button" href={url} target="_blank" rel="noreferrer" key={editor.id}>Notify {editor.name} on WhatsApp</a> : null;
              })}
            </div>

            <div className="editor-assign-row"><label>Select Editor<select aria-label={`Select an editor for ${project.client.name}'s ${project.eventType}`} value={workflow.assignedEditorEmail ?? ""} disabled={eligibleEditors.length === 0} onChange={(event) => event.target.value && assignEditor(project.id, event.target.value)}><option value="">{eligibleEditors.length ? "Choose a registered editor" : "No editors with editing specialties registered"}</option>{eligibleEditors.map((editor) => <option value={editor.email} key={editor.id}>{editor.name} · {editor.editingRoles.join(", ")}</option>)}</select></label>{eligibleEditors.length === 0 ? <p className="form-note">Approve a Team Registration with Video Editor, Still Photo Editor, or Album Editor selected, or have the person register through the Editor Workspace.</p> : null}</div>

            <div className="editor-setup-form">
              <label>Source Google Drive link<input type="url" placeholder="https://drive.google.com/..." value={fields.sourceDriveUrl} onChange={(event) => setSetup((current) => ({ ...current, [project.id]: { ...fields, sourceDriveUrl: event.target.value } }))} /></label>
              <label>Editing timeline / instructions<textarea rows={3} placeholder="Add notes, delivery instructions, and expected work sequence." value={fields.adminTimeline} onChange={(event) => setSetup((current) => ({ ...current, [project.id]: { ...fields, adminTimeline: event.target.value } }))} /></label>
              <label>Target delivery date<input type="date" value={fields.timelineDueDate} onChange={(event) => setSetup((current) => ({ ...current, [project.id]: { ...fields, timelineDueDate: event.target.value } }))} /></label>
              <div className="admin-milestone-builder"><div className="admin-milestone-heading"><strong>Editor checklist</strong><span>Editors tick each item when done.</span></div>{fields.milestones.map((milestone) => <div className="admin-milestone-row" key={milestone.id}><input aria-label="Editing milestone" value={milestone.label} placeholder="Milestone name" onChange={(event) => setSetup((current) => ({ ...current, [project.id]: { ...fields, milestones: fields.milestones.map((item) => item.id === milestone.id ? { ...item, label: event.target.value } : item) } }))} /><button type="button" className="danger-button" disabled={fields.milestones.length <= 1} onClick={() => setSetup((current) => ({ ...current, [project.id]: { ...fields, milestones: fields.milestones.filter((item) => item.id !== milestone.id) } }))}>Remove</button></div>)}<button type="button" className="secondary-button" onClick={() => setSetup((current) => ({ ...current, [project.id]: { ...fields, milestones: [...fields.milestones, { id: `${project.id}-M-${Date.now()}`, label: "", status: "NOT_STARTED" }] } }))}>+ Add milestone</button></div>
              <button type="button" className="primary-button" disabled={!workflow.assignedEditorEmail || fields.milestones.some((milestone) => !milestone.label.trim())} onClick={() => updateEditingSetup(project.id, fields)}>Save Editor Instructions</button>
            </div>
            {workflow.assignedEditorEmail && workflow.sourceDriveUrl ? <div className="notification-actions"><a className="editor-drive-link" href={workflow.sourceDriveUrl} target="_blank" rel="noreferrer">Open source Drive folder ↗</a>{assignedEditor && getWhatsAppUrl(assignedEditor.phone, `You have been assigned to edit ${project.eventType} for ${project.client.name}. Download the files here: ${workflow.sourceDriveUrl}`) ? <a className="secondary-button" href={getWhatsAppUrl(assignedEditor.phone, `You have been assigned to edit ${project.eventType} for ${project.client.name}. Download the files here: ${workflow.sourceDriveUrl}`) ?? undefined} target="_blank" rel="noreferrer">WhatsApp Drive link to editor</a> : null}</div> : null}
            {workflow.adminTimeline ? <div className="notification-actions"><span className="success-box">Timeline is visible in the client dashboard.</span>{getWhatsAppUrl(project.client.phone, clientTimelineMessage) ? <a className="secondary-button" href={getWhatsAppUrl(project.client.phone, clientTimelineMessage) ?? undefined} target="_blank" rel="noreferrer">WhatsApp timeline to client</a> : null}</div> : null}
            {workflow.assignedEditorEmail ? <div className="admin-editor-progress"><div className="editor-progress-head"><strong>Editor milestones</strong><b>{editingProgress}%</b></div><div className="editor-progress-track" role="progressbar" aria-label="Editor milestone progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={editingProgress}><span style={{ width: `${editingProgress}%` }} /></div><div className="editor-stage-list">{getEditingMilestones(workflow).map((milestone) => { const isCompleted = milestone.status === "COMPLETED"; return <div className={`editor-stage-row ${isCompleted ? "editor-stage-done" : ""}`} key={milestone.id}><span className="editor-stage-status-icon" aria-hidden="true">{isCompleted ? "✓" : "○"}</span><span>{milestone.label}</span><strong>{isCompleted ? "Completed" : "Not completed"}</strong></div>; })}</div></div> : null}
            {workflow.downloadCompletedAt ? <div className="success-box">Editor confirmed source download · {new Date(workflow.downloadCompletedAt).toLocaleString()}</div> : null}
            {workflow.deliveredAt ? <div className="success-box">Final edit delivered · <a href={workflow.finalDriveUrl} target="_blank" rel="noreferrer">Open delivery Drive folder</a> · {new Date(workflow.deliveredAt).toLocaleString()}</div> : null}
            <EditingChat projectId={project.id} />
          </article>;
        })}</div> : <div className="empty-state">No completed events yet. Team Leaders can mark events completed from the event tracker.</div>}
      </section>
    </div>
  );
}