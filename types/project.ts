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
