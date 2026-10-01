"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { EditingChat } from "@/components/common/EditingChat";
import type { EditingMilestone } from "@/types/project";
import { formatDate } from "@/utils/status";
import { getEditingMilestones, getEditingProgress, getWhatsAppUrl } from "@/utils/notifications";

type EditingSetup = {
  sourceDriveUrl: string;
  adminTimeline: string;
  timelineDueDate: string;
  milestones: EditingMilestone[];
};

export function EditorManagementPanel() {
  const { projects, editors, assignEditor, updateEditingSetup } = useProjectContext();
  const [setup, setSetup] = useState<Record<string, EditingSetup>>({});
  const completedProjects = projects.filter((project) => project.eventTracker?.eventCompletedAt);

  return <Box className="dashboard-shell editor-admin-dashboard">
    <Box className="page-intro editor-management-intro">
      <Box>
        <Typography variant="overline" color="secondary">Post-production</Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>Editor Management</Typography>
        <Typography color="text.secondary">Assign an editor, prepare the work plan, and track delivery.</Typography>
      </Box>
      <Chip color="primary" variant="outlined" label={`${editors.length} registered editors`} />
    </Box>

    <Box className="editor-admin-job-list">
      {completedProjects.length === 0 ? <Card variant="outlined"><CardContent><Alert severity="info">No completed events yet. When the team marks an event complete, it will appear here for editor assignment.</Alert></CardContent></Card> : completedProjects.map((project) => {
        const workflow = project.editingWorkflow ?? { stageProgress: {} };
        const fields: EditingSetup = setup[project.id] ?? {
          sourceDriveUrl: workflow.sourceDriveUrl ?? "",
          adminTimeline: workflow.adminTimeline ?? "",
          timelineDueDate: workflow.timelineDueDate ?? "",
          milestones: getEditingMilestones(workflow),
        };
        const assignedEditor = editors.find((editor) => editor.email === workflow.assignedEditorEmail);
        const eligibleEditors = editors.filter((editor) => editor.editingRoles?.length);
        const editingProgress = getEditingProgress(workflow);
        const completionMessage = `Hello ${project.client.name}, your ${project.eventType} event on ${formatDate(project.eventDate)} has been completed. Our post-production team will now prepare your edits.`;
        const timelineMessage = `Hello ${project.client.name}, your editing timeline for ${project.eventType} is ready: ${workflow.adminTimeline || "Please check your client dashboard for the timeline."}${workflow.timelineDueDate ? ` Target delivery: ${formatDate(workflow.timelineDueDate)}.` : ""}`;
        const sourceMessage = `You have been assigned to edit ${project.eventType} for ${project.client.name}. Download the files here: ${workflow.sourceDriveUrl ?? ""}`;
        const clientCompletionUrl = getWhatsAppUrl(project.client.phone, completionMessage);
        const sourceWhatsAppUrl = assignedEditor ? getWhatsAppUrl(assignedEditor.phone, sourceMessage) : null;
        const clientTimelineUrl = workflow.adminTimeline ? getWhatsAppUrl(project.client.phone, timelineMessage) : null;

        const updateFields = (update: Partial<EditingSetup>) => setSetup((current) => ({ ...current, [project.id]: { ...fields, ...update } }));

        return <Card variant="outlined" className="editor-admin-job" key={project.id}>
          <CardContent className="editor-admin-job-content">
            <Stack className="editor-job-heading" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
              <Box>
                <Typography variant="overline" color="secondary">{project.id} · {formatDate(project.eventDate)}</Typography>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>{project.client.name} · {project.eventType}</Typography>
                <Typography variant="body2" color="text.secondary">Completed {new Date(project.eventTracker?.eventCompletedAt ?? "").toLocaleString()}</Typography>
              </Box>
              <Chip color={assignedEditor ? "success" : "default"} variant={assignedEditor ? "filled" : "outlined"} label={assignedEditor ? `Assigned to ${assignedEditor.name}` : "Editor unassigned"} />
            </Stack>

            <Stack className="editor-job-notifications" direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {clientCompletionUrl ? <Button size="small" variant="outlined" color="success" startIcon={<WhatsAppIcon />} component="a" href={clientCompletionUrl} target="_blank" rel="noreferrer">Notify client</Button> : <Typography variant="caption" color="text.secondary">Client phone unavailable for WhatsApp.</Typography>}
              {editors.filter((editor) => editor.editingRoles?.length).map((editor) => {
                const message = `New completed editing work: ${project.eventType} for ${project.client.name} (${formatDate(project.eventDate)}). Admin will assign an editor based on specialties.`;
                const url = getWhatsAppUrl(editor.phone, message);
                return url ? <Button key={editor.id} size="small" variant="text" startIcon={<WhatsAppIcon />} component="a" href={url} target="_blank" rel="noreferrer">Notify {editor.name}</Button> : null;
              })}
            </Stack>

            <Divider />

            <Box className="editor-assignment-row">
              <FormControl fullWidth size="small" disabled={eligibleEditors.length === 0}>
                <InputLabel id={`select-editor-label-${project.id}`}>Select editor</InputLabel>
                <Select labelId={`select-editor-label-${project.id}`} label="Select editor" value={workflow.assignedEditorEmail ?? ""} onChange={(event) => { if (event.target.value) assignEditor(project.id, event.target.value); }}>
                  <MenuItem value=""><em>{eligibleEditors.length ? "Choose a registered editor" : "No editor accounts available"}</em></MenuItem>
                  {eligibleEditors.map((editor) => <MenuItem value={editor.email} key={editor.id}>{editor.name} · {editor.editingRoles.join(", ")}</MenuItem>)}
                </Select>
              </FormControl>
              {eligibleEditors.length === 0 ? <Alert severity="info">Approve a team registration with Video Editor, Still Photo Editor, or Album Editor selected, or register an editor from the Editor Workspace.</Alert> : null}
            </Box>

            <Box className="editor-work-plan">
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Work plan</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField fullWidth size="small" label="Google Drive source link" type="url" placeholder="https://drive.google.com/..." value={fields.sourceDriveUrl} onChange={(event) => updateFields({ sourceDriveUrl: event.target.value })} />
                <DatePicker label="Target delivery date" value={fields.timelineDueDate ? dayjs(fields.timelineDueDate) : null} onChange={(value) => updateFields({ timelineDueDate: value?.isValid() ? value.format("YYYY-MM-DD") : "" })} slotProps={{ textField: { size: "small", fullWidth: true } }} />
              </Stack>
              <TextField fullWidth size="small" multiline minRows={2} maxRows={5} label="Editing instructions" placeholder="Add notes, delivery instructions, and expected work sequence." value={fields.adminTimeline} onChange={(event) => updateFields({ adminTimeline: event.target.value })} />

              <Box className="admin-milestone-builder">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                  <Box><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Editor checklist</Typography><Typography variant="caption" color="text.secondary">Editors can mark each milestone complete after download confirmation.</Typography></Box>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => updateFields({ milestones: [...fields.milestones, { id: `${project.id}-M-${Date.now()}`, label: "", status: "NOT_STARTED" }] })}>Add milestone</Button>
                </Stack>
                <Stack spacing={1}>
                  {fields.milestones.map((milestone, index) => <Stack className="admin-milestone-row" direction="row" spacing={1} sx={{ alignItems: "center" }} key={milestone.id}>
                    <Typography variant="caption" color="text.secondary" className="admin-milestone-number">{String(index + 1).padStart(2, "0")}</Typography>
                    <TextField fullWidth size="small" value={milestone.label} placeholder="Milestone name" slotProps={{ htmlInput: { "aria-label": `Editing milestone ${index + 1}` } }} onChange={(event) => updateFields({ milestones: fields.milestones.map((item) => item.id === milestone.id ? { ...item, label: event.target.value } : item) })} />
                    <Tooltip title="Remove milestone"><span><IconButton color="error" size="small" disabled={fields.milestones.length <= 1} onClick={() => updateFields({ milestones: fields.milestones.filter((item) => item.id !== milestone.id) })}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Stack>)}
                </Stack>
              </Box>

              <Stack className="editor-plan-actions" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">Changes are published to the editor and client when saved.</Typography>
                <Button variant="contained" startIcon={<SaveOutlinedIcon />} disabled={!workflow.assignedEditorEmail || fields.milestones.some((milestone) => !milestone.label.trim())} onClick={() => updateEditingSetup(project.id, fields)}>Save work plan</Button>
              </Stack>
            </Box>

            {workflow.assignedEditorEmail && workflow.sourceDriveUrl ? <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" startIcon={<FolderOpenOutlinedIcon />} component="a" href={workflow.sourceDriveUrl} target="_blank" rel="noreferrer">Open source Drive</Button>
              {sourceWhatsAppUrl ? <Button size="small" variant="outlined" color="success" startIcon={<WhatsAppIcon />} component="a" href={sourceWhatsAppUrl} target="_blank" rel="noreferrer">Send Drive link</Button> : null}
              {clientTimelineUrl ? <Button size="small" variant="outlined" color="success" startIcon={<WhatsAppIcon />} component="a" href={clientTimelineUrl} target="_blank" rel="noreferrer">Send timeline to client</Button> : null}
            </Stack> : null}

            {workflow.assignedEditorEmail ? <Box className="admin-editor-progress">
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Editing progress</Typography><Chip size="small" color="primary" label={`${editingProgress}%`} /></Stack>
              <LinearProgress variant="determinate" value={editingProgress} />
              <Stack className="editor-milestone-status-list" spacing={0.5}>{getEditingMilestones(workflow).map((milestone) => <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }} key={milestone.id}><Typography variant="body2">{milestone.label}</Typography><Chip size="small" color={milestone.status === "COMPLETED" ? "success" : "default"} variant="outlined" label={milestone.status === "COMPLETED" ? "Completed" : "Not completed"} /></Stack>)}</Stack>
            </Box> : null}

            {workflow.downloadCompletedAt ? <Alert severity="success">Editor confirmed source download · {new Date(workflow.downloadCompletedAt).toLocaleString()}</Alert> : null}
            {workflow.deliveredAt && workflow.finalDriveUrl ? <Alert severity="success">Final edit delivered · <Button component="a" href={workflow.finalDriveUrl} target="_blank" rel="noreferrer" size="small">Open delivery Drive folder</Button> · {new Date(workflow.deliveredAt).toLocaleString()}</Alert> : null}
            <EditingChat projectId={project.id} />
          </CardContent>
        </Card>;
      })}
    </Box>
  </Box>;
}