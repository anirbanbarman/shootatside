import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "PM-1001",
    client: {
      id: "CL-2001",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "+91 8906349763",
    },
    eventType: "Wedding",
    eventDate: "2026-12-25",
    venue: "The Grand Palace, Kolkata",
    guestCount: 250,
    requirements:
      "Wedding photography + cinematic videography with pre-wedding coverage and full-day event editing.",
  },
  {
    id: "PM-1002",
    client: {
      id: "CL-2002",
      name: "Aisha Khan",
      email: "aisha.khan@example.com",
      phone: "+91 99887 66554",
    },
    eventType: "Corporate Event",
    eventDate: "2026-09-18",
    venue: "Hotel Westview, Mumbai",
    guestCount: 180,
    requirements:
      "Corporate gala coverage, keynote moments, team portraits, and branded highlight reel.",
    initialQuote: {
      amount: 75000,
      comment: "Wedding photography + cinematic videography package.",
      sentAt: "2026-08-10T10:30:00.000Z",
    },
    clientResponse: {
      type: "REJECTED",
      comment: "The quoted amount is above our budget.",
      respondedAt: "2026-08-11T16:45:00.000Z",
    },
    negotiation: {
      amount: 65000,
      comment: "We can offer a discounted package at ₹65,000.",
      sentAt: "2026-08-12T09:15:00.000Z",
    },
  },
  {
    id: "PM-1003",
    client: {
      id: "CL-2003",
      name: "Nina Patel",
      email: "nina.patel@example.com",
      phone: "+91 98111 77889",
    },
    eventType: "Birthday Celebration",
    eventDate: "2026-11-05",
    venue: "Skyline Rooftop, Bengaluru",
    guestCount: 120,
    requirements:
      "Lifestyle portrait session, candid coverage, and a short teaser video for social media.",
    initialQuote: {
      amount: 42000,
      comment: "Birthday celebration coverage with candid portraits and short recap video.",
      sentAt: "2026-08-12T13:00:00.000Z",
    },
    clientResponse: {
      type: "ACCEPTED",
      respondedAt: "2026-08-13T12:00:00.000Z",
    },
  },
  {
    id: "PM-1004",
    client: {
      id: "CL-2004",
      name: "Harsh Mehta",
      email: "harsh.mehta@example.com",
      phone: "+91 97654 12345",
    },
    eventType: "Product Launch",
    eventDate: "2026-10-02",
    venue: "Innovation Hub, Ahmedabad",
    guestCount: 90,
    requirements:
      "Event coverage, product hero shots, stage highlights, and social media teaser content.",
    initialQuote: {
      amount: 56000,
      comment: "Product launch coverage with event photography and branded highlight reel.",
      sentAt: "2026-08-14T11:00:00.000Z",
    },
    clientResponse: {
      type: "REJECTED",
      comment: "This is still above our planned budget.",
      respondedAt: "2026-08-14T18:15:00.000Z",
    },
    negotiation: {
      amount: 48000,
      comment: "We can reduce the package to cover only product launch essentials.",
      sentAt: "2026-08-15T08:45:00.000Z",
    },
    negotiationResponse: {
      type: "REJECTED",
      comment: "Unfortunately, this is still above our budget.",
      respondedAt: "2026-08-16T09:30:00.000Z",
    },
  },
];
