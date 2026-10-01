export type ViewMode = "admin" | "client" | "team" | "editor";

export type ProjectStatus =
  | "NEW_REQUEST"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "QUOTE_REJECTED"
  | "NEGOTIATION_SENT"
  | "NEGOTIATION_ACCEPTED"
  | "NEGOTIATION_REJECTED"
  | "PROJECT_CONFIRMED";

export type ClientDecisionType = "ACCEPTED" | "REJECTED";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export type ContactPreference = "PHONE" | "EMAIL" | "WHATSAPP";

export interface ClientContactDetails {
  phone: string;
  email: string;
  preferredContact: ContactPreference;
  bestTimeToContact: string;
  message?: string;
  submittedAt: string;
}

export interface Quote {
  amount: number;
  comment: string;
  sentAt: string;
  advancePercent?: number;
}

export interface Negotiation {
  amount: number;
  comment: string;
  sentAt: string;
  advancePercent?: number;
}

export interface AdvancePayment {
  advancePercent: number;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt?: string;
}

export interface ClientResponse {
  type: ClientDecisionType;
  comment?: string;
  respondedAt: string;
}

export interface TeamAssignment {
  member: string;
  date: string;
  camera: string;
  gear: string;
  notes: string;
  assignedAt: string;
}

export interface EventTeamMember {
  member: string;
  memberEmail: string;
  memberPhone?: string;
  role: TeamMemberRole;
  userType?: TeamUserType;
  date: string;
  camera: string;
  gear: string;
  notes: string;
  assignedAt: string;
}

export interface TeamBrief {
  callTime: string;
  callVenue: string;
  updatedAt: string;
}

export interface EventTrackerTask {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

export interface EventTrackerMessage {
  id: string;
  sender: string;
  senderRole: "admin" | "team-leader";
  message: string;
  sentAt: string;
}

export interface EventTracker {
  leaderArrivedAt?: string;
  eventCompletedAt?: string;
  memberJoinedAt: Record<string, string>;
  tasks: EventTrackerTask[];
  delayNote?: string;
  messages: EventTrackerMessage[];
}

export interface EditorAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  editingRoles: EditingRole[];
  createdAt: string;
}

export type EditorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EditorApplication {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  phonePe: string;
  aadharFileName: string;
  aadharDataUrl: string;
  selfieFileName: string;
  selfieDataUrl: string;
  editingRoles: EditingRole[];
  submittedAt: string;
  status: EditorApplicationStatus;
}

export const EDITING_ROLES = ["Video Editor", "Still Photo Editor", "Album Editor"] as const;
export type EditingRole = (typeof EDITING_ROLES)[number];

export type EditingStage = "Wedding day morning" | "Wedding Evening" | "Bidayee bodhuboron" | "Reception";
export type EditingStageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface EditingStageProgress {
  status: EditingStageStatus;
  updatedAt?: string;
}

export interface EditingMilestone {
  id: string;
  label: string;
  status: EditingStageStatus;
  updatedAt?: string;
}

export interface EditingChatMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: "admin" | "client" | "editor";
  message: string;
  sentAt: string;
}

export interface EditingWorkflow {
  assignedEditorEmail?: string;
  sourceDriveUrl?: string;
  downloadCompletedAt?: string;
  adminTimeline?: string;
  timelineDueDate?: string;
  milestones?: EditingMilestone[];
  stageProgress: Partial<Record<EditingStage, EditingStageProgress>>;
  chatMessages?: EditingChatMessage[];
  finalDriveUrl?: string;
  deliveredAt?: string;
}

export interface TeamInterest {
  member: string;
  memberEmail: string;
  requestedAt: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
}

export type TeamRegistrationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type TeamUserType = "Team Leader" | "Member";

export interface TeamRegistration {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  aadharFileName: string;
  selfieFileName: string;
  phonePe: string;
  preferredRoles: TeamMemberRole[];
  username?: string;
  password?: string;
  status: TeamRegistrationStatus;
  submittedAt: string;
}

export const TEAM_MEMBER_ROLES = [
  "Candid Photographer",
  "Group Photo taker",
  "Traditional photo taker",
  "Couple Photo taker",
  "Cinematographer",
  "Reel Maker",
  "Teaser Maker",
  "Halping Hand",
  "Drone operator",
  "Live Video",
  "Sound Operator",
  "Driver",
] as const;

// Keep the old value in the type for existing saved assignments; it is not a selectable duty role.
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number] | "Team Leader";

export interface TeamMember {
  id: string;
  name: string;
  role: TeamMemberRole;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Project {
  id: string;
  client: Client;
  eventType: string;
  eventDate: string;
  venue: string;
  requirements: string;
  requestAcceptedAt?: string;
  clientContactDetails?: ClientContactDetails;
  initialQuote?: Quote;
  clientResponse?: ClientResponse;
  negotiation?: Negotiation;
  negotiationResponse?: ClientResponse;
  payment?: AdvancePayment;
  teamAssignment?: TeamAssignment;
  eventTeam?: EventTeamMember[];
  teamBrief?: TeamBrief;
  eventTracker?: EventTracker;
  editingWorkflow?: EditingWorkflow;
  teamInterest?: TeamInterest[];
}

export interface NotificationState {
  type: "success" | "error";
  message: string;
}

export interface TimelineEntry {
  title: string;
  detail?: string;
  amount?: number;
  timestamp?: string;
}
