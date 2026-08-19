import type { Project, ProjectStatus, TimelineEntry } from "@/types/project";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateValue: string): string {
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getProjectStatus(project: Project): ProjectStatus {
  if (project.payment?.status === "PAID" && (project.clientResponse?.type === "ACCEPTED" || project.negotiationResponse?.type === "ACCEPTED")) {
    return "PROJECT_CONFIRMED";
  }

  if (project.negotiationResponse?.type === "ACCEPTED") {
    return "NEGOTIATION_ACCEPTED";
  }

  if (project.clientResponse?.type === "ACCEPTED" && !project.negotiation) {
    return "QUOTE_ACCEPTED";
  }

  if (project.negotiationResponse?.type === "REJECTED") {
    return "NEGOTIATION_REJECTED";
  }

  if (project.negotiation && !project.negotiationResponse) {
    return "NEGOTIATION_SENT";
  }

  if (project.clientResponse?.type === "REJECTED") {
    return "QUOTE_REJECTED";
  }

  if (project.initialQuote) {
    return "QUOTE_SENT";
  }

  return "NEW_REQUEST";
}

export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    NEW_REQUEST: "Pending",
    QUOTE_SENT: "Quote Sent",
    QUOTE_ACCEPTED: "Accepted",
    QUOTE_REJECTED: "Rejected",
    NEGOTIATION_SENT: "Negotiation Sent",
    NEGOTIATION_ACCEPTED: "Negotiation Accepted",
    NEGOTIATION_REJECTED: "Negotiation Rejected",
    PROJECT_CONFIRMED: "Confirmed",
  };

  return labels[status];
}

export function getProjectTimeline(project: Project): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { title: "Project Created", timestamp: new Date().toISOString() },
  ];

  if (project.initialQuote) {
    entries.push({
      title: "Quote Sent",
      detail: project.initialQuote.comment,
      amount: project.initialQuote.amount,
      timestamp: project.initialQuote.sentAt,
    });
  }

  if (project.clientResponse?.type === "REJECTED") {
    entries.push({
      title: "Client Rejected",
      detail: project.clientResponse.comment || "No reason provided.",
      timestamp: project.clientResponse.respondedAt,
    });
  }

  if (project.negotiation) {
    entries.push({
      title: "Negotiation Sent",
      detail: project.negotiation.comment,
      amount: project.negotiation.amount,
      timestamp: project.negotiation.sentAt,
    });
  }

  if (project.negotiationResponse?.type === "ACCEPTED") {
    entries.push({ title: "Client Accepted", timestamp: project.negotiationResponse.respondedAt });
  }

  if (project.negotiationResponse?.type === "REJECTED") {
    entries.push({
      title: "Negotiation Rejected",
      detail: project.negotiationResponse.comment || "No reason provided.",
      timestamp: project.negotiationResponse.respondedAt,
    });
  }

  if (project.clientResponse?.type === "ACCEPTED") {
    entries.push({ title: "Client Accepted", timestamp: project.clientResponse.respondedAt });
  }

  if (project.payment) {
    entries.push({
      title: project.payment.status === "PAID" ? "Advance Payment Received" : "Advance Payment Pending",
      detail: `${project.payment.advancePercent}% advance (${formatCurrency(project.payment.amount)})`,
      timestamp: project.payment.paidAt ?? new Date().toISOString(),
    });
  }

  if (getProjectStatus(project) === "PROJECT_CONFIRMED") {
    entries.push({ title: "Project Confirmed", timestamp: project.payment?.paidAt ?? new Date().toISOString() });
  }

  return entries;
}
