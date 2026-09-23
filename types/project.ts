export type ViewMode = "admin" | "client" | "team";

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
  userType: TeamUserType;
  preferredRoles: TeamMemberRole[];
  username?: string;
  password?: string;
  status: TeamRegistrationStatus;
  submittedAt: string;
}

export const TEAM_MEMBER_ROLES = [
  "Team Leader",
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

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

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
  guestCount: number;
  requirements: string;
  initialQuote?: Quote;
  clientResponse?: ClientResponse;
  negotiation?: Negotiation;
  negotiationResponse?: ClientResponse;
  payment?: AdvancePayment;
  teamAssignment?: TeamAssignment;
  eventTeam?: EventTeamMember[];
  teamBrief?: TeamBrief;
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
