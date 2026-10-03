import type { EditingMilestone, EditingStage, EditingWorkflow, EventTracker } from "@/types/project";

export const EDITING_STAGES: EditingStage[] = [
  "Wedding day morning",
  "Wedding Evening",
  "Bidayee bodhuboron",
  "Reception",
];

export function getEditingMilestones(workflow?: EditingWorkflow): EditingMilestone[] {
  if (workflow?.milestones) return workflow.milestones;

  return EDITING_STAGES.map((label) => ({
    id: `legacy-${label}`,
    label,
    status: workflow?.stageProgress[label]?.status ?? "NOT_STARTED",
    updatedAt: workflow?.stageProgress[label]?.updatedAt,
  }));
}

export function getEditingProgress(workflow?: EditingWorkflow): number {
  const milestones = getEditingMilestones(workflow);
  if (milestones.length === 0) return 0;

  const progress = milestones.reduce((total, milestone) => {
    return total + (milestone.status === "COMPLETED" ? 1 : milestone.status === "IN_PROGRESS" ? 0.5 : 0);
  }, 0);

  return Math.round((progress / milestones.length) * 100);
}

export function getTrackerMemberJoinTime(tracker: EventTracker, memberEmail: string, leaderEmail?: string): string | undefined {
  return tracker.memberJoinedAt[memberEmail] ?? (memberEmail === leaderEmail ? tracker.leaderArrivedAt : undefined);
}

export function getWhatsAppUrl(phone: string, message: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
