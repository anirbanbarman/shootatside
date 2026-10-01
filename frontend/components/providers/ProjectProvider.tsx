"use client";
/* eslint-disable react-hooks/preserve-manual-memoization */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { EDITING_ROLES, type ClientContactDetails, type EditingChatMessage, type EditingMilestone, type EditingRole, type EditorAccount, type EditorApplication, type EventTeamMember, type EventTracker, type EventTrackerTask, type Project, type TeamInterest, type TeamMember, type TeamMemberRole, type TeamRegistration, type ViewMode } from "@/types/project";
import { getEditingMilestones } from "@/utils/notifications";

type UserRole = "admin" | "client" | "team" | "editor";

interface SessionUser {
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
}

type DemoScenario = "pending" | "quote" | "negotiation" | "confirmed";

interface ProjectContextValue {
  view: ViewMode;
  setView: (mode: ViewMode) => void;
  isLoggedIn: boolean;
  isReady: boolean;
  activeRole: ViewMode | "guest";
  currentUser: SessionUser | null;
  loginAdmin: (user: SessionUser) => void;
  loginClient: (user: SessionUser) => void;
  loginTeam: (username: string, password: string) => boolean;
  loginEditor: (username: string, password: string) => boolean;
  editors: EditorAccount[];
  editorApplications: EditorApplication[];
  submitEditorApplication: (input: Omit<EditorApplication, "id" | "submittedAt" | "status">) => boolean;
  approveEditorApplication: (applicationId: string, username: string, password: string) => boolean;
  rejectEditorApplication: (applicationId: string) => void;
  createEditor: (input: Omit<EditorAccount, "id" | "createdAt">) => boolean;
  registerTeam: (input: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => void;
  teamRegistrations: TeamRegistration[];
  approveTeamRegistration: (registrationId: string, username: string, password: string) => void;
  rejectTeamRegistration: (registrationId: string) => void;
  teamMembers: TeamMember[];
  createTeamMember: (input: { name: string; role: TeamMemberRole; email: string; phone: string }) => void;
  logout: () => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  createProjectRequest: (input: {
    name: string;
    email: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue: string;
    requirements: string;
  }) => void;
  acceptClientRequest: (projectId: string) => void;
  submitClientContactDetails: (projectId: string, details: Omit<ClientContactDetails, "submittedAt">) => void;
  resetDemoProjects: () => void;
  seedDemoProject: (scenario: DemoScenario) => void;
  sendQuote: (projectId: string, amount: number, comment: string, advancePercent?: number) => Promise<void>;
  acceptQuote: (projectId: string) => void;
  rejectQuote: (projectId: string, comment: string) => void;
  sendNegotiation: (projectId: string, amount: number, comment: string, advancePercent?: number) => void;
  acceptNegotiation: (projectId: string) => void;
  rejectNegotiation: (projectId: string, comment: string) => void;
  payAdvance: (projectId: string) => void;
  requestTeamInterest: (projectId: string) => string | null;
  approveTeamInterest: (projectId: string, memberEmail: string) => void;
  rejectTeamInterest: (projectId: string, memberEmail: string) => void;
  assignTeam: (projectId: string, assignment: { member: string; date: string; camera: string; gear: string; notes: string }) => void;
  assignEventTeam: (projectId: string, assignments: Omit<EventTeamMember, "assignedAt">[]) => void;
  updateClientTeamBrief: (projectId: string, brief: { callTime: string; callVenue: string }) => void;
  addEventTrackerTask: (projectId: string, label: string) => void;
  toggleEventTrackerMember: (projectId: string, memberEmail: string) => void;
  markLeaderArrived: (projectId: string) => void;
  toggleEventTrackerTask: (projectId: string, taskId: string) => void;
  updateEventDelay: (projectId: string, delayNote: string) => void;
  sendEventTrackerMessage: (projectId: string, message: string, senderRole: "admin" | "team-leader") => void;
  markEventCompleted: (projectId: string) => void;
  assignEditor: (projectId: string, editorEmail: string) => void;
  updateEditingSetup: (projectId: string, setup: { sourceDriveUrl: string; adminTimeline: string; timelineDueDate: string; milestones: EditingMilestone[] }) => void;
  sendEditingChatMessage: (projectId: string, message: string) => void;
  markEditorDownloadComplete: (projectId: string, editorEmail: string) => void;
  updateEditingMilestone: (projectId: string, editorEmail: string, milestoneId: string, status: "NOT_STARTED" | "COMPLETED") => void;
  deliverEditedFiles: (projectId: string, editorEmail: string, finalDriveUrl: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const STORAGE_KEYS = {
  selectedProjectId: "shootatside-selected-project-id",
  user: "shootatside-current-user",
  roleState: "shootatside-role-state",
} as const;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? `Request failed for ${endpoint}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const DEFAULT_ROLE_STATE = {
  view: "admin" as ViewMode,
  activeRole: "guest" as ViewMode | "guest",
};

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T | null | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readSessionValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedValue = window.sessionStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue<T>(key: string, value: T | null | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null || value === undefined) {
    window.sessionStorage.removeItem(key);
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewMode>(DEFAULT_ROLE_STATE.view);
  const [activeRole, setActiveRole] = useState<ViewMode | "guest">(DEFAULT_ROLE_STATE.activeRole);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editors, setEditors] = useState<EditorAccount[]>([]);
  const [editorApplications, setEditorApplications] = useState<EditorApplication[]>([]);
  const [isReady, setIsReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRoleState = readSessionValue<{ view: ViewMode; activeRole: ViewMode | "guest" }>(STORAGE_KEYS.roleState, DEFAULT_ROLE_STATE);
    const storedUser = readSessionValue<SessionUser | null>(STORAGE_KEYS.user, null);
    const normalizedUser = storedUser
      ? {
          name: storedUser.name ?? "",
          email: storedUser.email ?? "",
          phone: storedUser.phone ?? "",
          role: storedUser.role ?? (storedRoleState.activeRole === "admin" ? "admin" : storedRoleState.activeRole === "client" ? "client" : "team"),
        }
      : null;

    setView(storedRoleState.view ?? "admin");
    setActiveRole(storedRoleState.activeRole ?? "admin");
    setCurrentUser(normalizedUser);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setIsReady(true);
  }, [syncFromStorage]);

  const loadFromApi = useCallback(async () => {
    try {
      const [projectsResponse, appsResponse, registrationsResponse] = await Promise.all([
        fetchApi<Project[]>("/projects").catch(() => []),
        fetchApi<EditorApplication[]>("/editor/applications").catch(() => []),
        fetchApi<TeamRegistration[]>("/team/registrations").catch(() => []),
      ]);

      setProjects(projectsResponse ?? []);
      setEditorApplications(appsResponse ?? []);
      setTeamRegistrations(registrationsResponse ?? []);
      const storedSelectedProject = readStoredValue<string | null>(STORAGE_KEYS.selectedProjectId, null);
      setSelectedProjectId(
        projectsResponse?.find((project) => project.id === storedSelectedProject)?.id
          ?? projectsResponse?.[0]?.id
          ?? "",
      );

      const editorsFromRegistrations = (registrationsResponse ?? []).flatMap((registration) => {
        if (registration.status !== "ACCEPTED" || !registration.username || !registration.password) {
          return [];
        }

        const editingRoles = (registration.preferredRoles as Array<TeamMemberRole | EditingRole>).filter((role): role is EditingRole => EDITING_ROLES.includes(role as EditingRole));
        if (editingRoles.length === 0) {
          return [];
        }

        return [{
          id: `EDITOR-${registration.id}`,
          name: registration.name,
          email: registration.email.trim().toLowerCase(),
          phone: registration.mobile,
          username: registration.username,
          password: registration.password,
          editingRoles,
          createdAt: registration.submittedAt,
        } satisfies EditorAccount];
      });

      setEditors((current) => {
        const map = new Map(current.map((editor) => [editor.email.toLowerCase(), editor]));
        editorsFromRegistrations.forEach((editor) => {
          map.set(editor.email.toLowerCase(), editor);
        });
        return Array.from(map.values());
      });
    } catch {
      setProjects([]);
      setEditorApplications([]);
      setTeamRegistrations([]);
      setSelectedProjectId("");
    }
  }, []);

  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady) {
      return;
    }

    if (selectedProjectId) {
      writeStoredValue(STORAGE_KEYS.selectedProjectId, selectedProjectId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.selectedProjectId);
    }

    if (currentUser) {
      writeSessionValue(STORAGE_KEYS.user, currentUser);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEYS.user);
    }

    writeSessionValue(STORAGE_KEYS.roleState, { view, activeRole });
  }, [activeRole, currentUser, isReady, selectedProjectId, view]);

  const isLoggedIn = Boolean(currentUser);

  const loginAdmin = useCallback((user: SessionUser) => {
    setCurrentUser({ ...user, role: "admin" });
    setActiveRole("admin");
    setView("admin");
  }, []);

  const loginClient = useCallback((user: SessionUser) => {
    setCurrentUser({ ...user, role: "client" });
    setActiveRole("client");
    setView("client");
  }, []);

  const loginTeam = useCallback((username: string, password: string) => {
    const registration = teamRegistrations.find((item) => item.status === "ACCEPTED" && item.username === username.trim() && item.password === password);
    const isEditor = registration?.preferredRoles.some((role) => EDITING_ROLES.includes(role as EditingRole));
    if (!registration || isEditor) {
      return false;
    }

    setCurrentUser({ name: registration.name, email: registration.email, phone: registration.mobile, role: "team" });
    setActiveRole("team");
    setView("team");
    return true;
  }, [teamRegistrations]);

  const loginEditor = useCallback((username: string, password: string) => {
    const editor = editors.find((item) => item.username === username.trim() && item.password === password);
    if (!editor) return false;
    setCurrentUser({ name: editor.name, email: editor.email, phone: editor.phone, role: "editor" });
    setActiveRole("editor");
    setView("editor");
    return true;
  }, [editors]);

  const createEditor = useCallback((input: Omit<EditorAccount, "id" | "createdAt">) => {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    if (editors.some((editor) => editor.email.toLowerCase() === email || editor.username.toLowerCase() === username.toLowerCase())) {
      return false;
    }

    setEditors((current) => [{ ...input, email: input.email.trim().toLowerCase(), id: `EDITOR-${Date.now()}`, createdAt: new Date().toISOString() }, ...current]);
    return true;
  }, [editors]);

  const submitEditorApplication = useCallback((input: Omit<EditorApplication, "id" | "submittedAt" | "status">) => {
    const email = input.email.trim().toLowerCase();
    if (!email || input.editingRoles.length === 0 || !input.aadharDataUrl || !input.selfieDataUrl) return false;
    if (editors.some((editor) => editor.email.toLowerCase() === email)
      || editorApplications.some((application) => application.email.toLowerCase() === email && application.status !== "REJECTED")) return false;

    const application: EditorApplication = {
      ...input,
      email,
      id: `EDITOR-APP-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
    };
    setEditorApplications((current) => [application, ...current]);
    return true;
  }, [editorApplications, editors]);

  const approveEditorApplication = useCallback((applicationId: string, username: string, password: string) => {
    const application = editorApplications.find((item) => item.id === applicationId && item.status === "PENDING");
    const normalizedUsername = username.trim();
    if (!application || !normalizedUsername || !password.trim()) return false;
    if (editors.some((editor) => editor.email.toLowerCase() === application.email.toLowerCase() || editor.username.toLowerCase() === normalizedUsername.toLowerCase())) return false;

    setEditors((current) => [{
      id: `EDITOR-${application.id}`,
      name: application.name,
      email: application.email,
      phone: application.mobile,
      username: normalizedUsername,
      password,
      editingRoles: application.editingRoles,
      createdAt: new Date().toISOString(),
    }, ...current]);
    setEditorApplications((current) => current.map((item) => item.id === applicationId ? { ...item, status: "APPROVED" } : item));
    return true;
  }, [editorApplications, editors]);

  const rejectEditorApplication = useCallback((applicationId: string) => {
    setEditorApplications((current) => current.map((item) => item.id === applicationId && item.status === "PENDING"
      ? { ...item, status: "REJECTED" }
      : item));
  }, []);

  const registerTeam = useCallback((input: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    setTeamRegistrations((current) => [
      {
        ...input,
        id: `TEAM-${Date.now()}`,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }, []);

  const approveTeamRegistration = useCallback((registrationId: string, username: string, password: string) => {
    const registration = teamRegistrations.find((item) => item.id === registrationId);
    if (!registration) return;

    const editingRoles = (registration.preferredRoles as Array<TeamMemberRole | EditingRole>).filter((role): role is EditingRole => EDITING_ROLES.includes(role as EditingRole));

    setTeamRegistrations((current) => current.map((item) => item.id === registrationId
      ? { ...item, username, password, status: "ACCEPTED" }
      : item));

    if (editingRoles.length > 0) {
      setEditors((current) => {
        const existingEditor = current.find((editor) => editor.email.toLowerCase() === registration.email.toLowerCase());
        if (existingEditor) {
          return current.map((editor) => editor.id === existingEditor.id
            ? { ...editor, editingRoles: Array.from(new Set([...(editor.editingRoles ?? []), ...editingRoles])) }
            : editor);
        }

        const editorAccount: EditorAccount = {
          id: `EDITOR-${Date.now()}`,
          name: registration.name,
          email: registration.email.trim().toLowerCase(),
          phone: registration.mobile,
          username: username.trim(),
          password,
          editingRoles,
          createdAt: new Date().toISOString(),
        };

        return [editorAccount, ...current];
      });
    }
  }, [teamRegistrations]);

  const rejectTeamRegistration = useCallback((registrationId: string) => {
    setTeamRegistrations((current) => current.map((registration) => registration.id === registrationId
      ? { ...registration, status: "REJECTED" }
      : registration));
  }, []);

  const createTeamMember = useCallback((input: { name: string; role: TeamMemberRole; email: string; phone: string }) => {
    setTeamMembers((current) => [{ ...input, id: `MEMBER-${Date.now()}`, createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRole("guest");
    setView("admin");
  }, []);

  const createProjectRequest = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      eventType: string;
      eventDate: string;
      venue: string;
      requirements: string;
    }) => {
      const payload = {
        client: {
          id: `CL-${Date.now()}`,
          name: input.name,
          email: input.email,
          phone: input.phone,
        },
        eventType: input.eventType,
        eventDate: input.eventDate,
        venue: input.venue,
        requirements: input.requirements,
      };

      try {
        const response = await fetchApi<{ ok: boolean; project: Project }>("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setProjects((current) => [response.project, ...current]);
        setSelectedProjectId(response.project.id);
        setCurrentUser({ name: input.name, email: input.email, phone: input.phone, role: "client" });
        setActiveRole("client");
        setView("client");
      } catch {
        const generatedProject: Project = {
          id: `PM-${Date.now()}`,
          client: payload.client,
          eventType: input.eventType,
          eventDate: input.eventDate,
          venue: input.venue,
          requirements: input.requirements,
        };

        setProjects((current) => [generatedProject, ...current]);
        setSelectedProjectId(generatedProject.id);
      }
    },
    [],
  );

  const resetDemoProjects = useCallback(() => {
    setProjects([]);
    setSelectedProjectId("");
  }, []);

  const seedDemoProject = useCallback(async (scenario: DemoScenario) => {
    void scenario;
    await loadFromApi();
  }, [loadFromApi]);

  const sendQuote = useCallback(async (projectId: string, amount: number, comment: string, advancePercent = 30) => {
    const safeAdvancePercent = Math.min(100, Math.max(0, Number(advancePercent) || 30));
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/quote`, {
      method: "PATCH",
      body: JSON.stringify({ amount, comment, advancePercent: safeAdvancePercent }),
    });

    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const acceptClientRequest = useCallback((projectId: string) => {
    setProjects((current) => current.map((project) => project.id === projectId && !project.requestAcceptedAt
      ? { ...project, requestAcceptedAt: new Date().toISOString() }
      : project));
  }, []);

  const submitClientContactDetails = useCallback((projectId: string, details: Omit<ClientContactDetails, "submittedAt">) => {
    if (!currentUser || currentUser.role !== "client") return;

    setProjects((current) => current.map((project) => project.id === projectId
      && project.requestAcceptedAt
      && project.client.email.toLowerCase() === currentUser.email.toLowerCase()
      ? { ...project, clientContactDetails: { ...details, submittedAt: new Date().toISOString() } }
      : project));
  }, [currentUser]);

  const acceptQuote = useCallback((projectId: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          clientResponse: {
            type: "ACCEPTED",
            respondedAt: new Date().toISOString(),
          },
        };
      }),
    );
  }, []);

  const rejectQuote = useCallback((projectId: string, comment: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          clientResponse: {
            type: "REJECTED",
            comment,
            respondedAt: new Date().toISOString(),
          },
          negotiation: undefined,
          negotiationResponse: undefined,
        };
      }),
    );
  }, []);

  const sendNegotiation = useCallback((projectId: string, amount: number, comment: string, advancePercent = 30) => {
    const safeAdvancePercent = Math.min(100, Math.max(0, Number(advancePercent) || 30));
    const advanceAmount = Math.round((amount * safeAdvancePercent) / 100);

    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          negotiation: {
            amount,
            comment,
            sentAt: new Date().toISOString(),
            advancePercent: safeAdvancePercent,
          },
          payment: {
            advancePercent: safeAdvancePercent,
            amount: advanceAmount,
            status: project.payment?.status === "PAID" ? "PAID" : "PENDING",
          },
          negotiationResponse: undefined,
        };
      }),
    );
  }, []);

  const acceptNegotiation = useCallback((projectId: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          negotiationResponse: {
            type: "ACCEPTED",
            respondedAt: new Date().toISOString(),
          },
        };
      }),
    );
  }, []);

  const payAdvance = useCallback((projectId: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        const activeQuote = project.negotiation ?? project.initialQuote;
        const advancePercent = activeQuote?.advancePercent ?? project.payment?.advancePercent ?? 30;
        const advanceAmount = Math.round(((activeQuote?.amount ?? project.payment?.amount ?? 0) * advancePercent) / 100);

        return {
          ...project,
          payment: {
            advancePercent,
            amount: advanceAmount,
            status: "PAID",
            paidAt: new Date().toISOString(),
          },
        };
      }),
    );
  }, []);

  const requestTeamInterest = useCallback((projectId: string) => {
    if (!currentUser || currentUser.role !== "team") {
      return "Please log in as an approved team member.";
    }

    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return "This event is no longer available.";
    }

    const hasSameDateRequest = projects.some((item) => item.id !== projectId
      && item.eventDate === project.eventDate
      && item.teamInterest?.some((interest) => interest.memberEmail === currentUser.email
        && (interest.status === "PENDING" || interest.status === "ACCEPTED")));

    if (hasSameDateRequest) {
      return `You can assign only one event on ${project.eventDate}.`;
    }

    setProjects((current) => current.map((item) => {
      if (item.id !== projectId) {
        return item;
      }

      const interests = item.teamInterest ?? [];
      const existingInterest = interests.find((interest) => interest.memberEmail === currentUser.email);
      const nextInterest = {
        member: currentUser.name,
        memberEmail: currentUser.email,
        requestedAt: new Date().toISOString(),
        status: "PENDING" as const,
      };

      return {
        ...item,
        teamInterest: existingInterest
          ? interests.map((interest) => interest.memberEmail === currentUser.email ? nextInterest : interest)
          : [...interests, nextInterest],
      };
    }));
    return null;
  }, [currentUser, projects]);

  const approveTeamInterest = useCallback((projectId: string, memberEmail: string) => {
    setProjects((current) =>
      current.map((project) => project.id === projectId && project.teamInterest
        ? { ...project, teamInterest: project.teamInterest.map((interest) => interest.memberEmail === memberEmail && interest.status === "PENDING" ? { ...interest, status: "ACCEPTED" } : interest) }
        : project),
    );
  }, []);

  const rejectTeamInterest = useCallback((projectId: string, memberEmail: string) => {
    setProjects((current) =>
      current.map((project) => project.id === projectId && project.teamInterest
        ? { ...project, teamInterest: project.teamInterest.map((interest) => interest.memberEmail === memberEmail && interest.status === "PENDING" ? { ...interest, status: "REJECTED" } : interest) }
        : project),
    );
  }, []);

  const rejectNegotiation = useCallback((projectId: string, comment: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          negotiationResponse: {
            type: "REJECTED",
            comment,
            respondedAt: new Date().toISOString(),
          },
        };
      }),
    );
  }, []);

  const assignTeam = useCallback((projectId: string, assignment: { member: string; date: string; camera: string; gear: string; notes: string }) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          teamAssignment: {
            ...assignment,
            assignedAt: new Date().toISOString(),
          },
        };
      }),
    );
  }, []);

  const assignEventTeam = useCallback((projectId: string, assignments: Omit<EventTeamMember, "assignedAt">[]) => {
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, eventTeam: assignments.map((assignment) => ({ ...assignment, assignedAt: new Date().toISOString() })) }
      : project));
  }, []);

  const updateClientTeamBrief = useCallback((projectId: string, brief: { callTime: string; callVenue: string }) => {
    setProjects((current) => current.map((project) => project.id === projectId && project.eventTeam?.length
      ? { ...project, teamBrief: { ...brief, updatedAt: new Date().toISOString() } }
      : project));
  }, []);

  const updateTracker = useCallback((projectId: string, update: (tracker: EventTracker) => EventTracker) => {
    setProjects((current) => current.map((project) => project.id === projectId ? { ...project, eventTracker: update(project.eventTracker ?? { memberJoinedAt: {}, tasks: [], messages: [] }) } : project));
  }, []);
  const addEventTrackerTask = useCallback((projectId: string, label: string) => updateTracker(projectId, (tracker) => ({ ...tracker, tasks: [...tracker.tasks, { id: `TASK-${Date.now()}`, label, completed: false }] })), [updateTracker]);
  const toggleEventTrackerMember = useCallback((projectId: string, memberEmail: string) => updateTracker(projectId, (tracker) => { const joined = tracker.memberJoinedAt[memberEmail]; const memberJoinedAt = { ...tracker.memberJoinedAt }; if (joined) delete memberJoinedAt[memberEmail]; else memberJoinedAt[memberEmail] = new Date().toISOString(); return { ...tracker, memberJoinedAt }; }), [updateTracker]);
  const markLeaderArrived = useCallback((projectId: string) => {
    if (!currentUser?.email) return;

    updateTracker(projectId, (tracker) => {
      const leaderArrivedAt = tracker.leaderArrivedAt ? undefined : new Date().toISOString();
      const memberJoinedAt = { ...tracker.memberJoinedAt };

      if (leaderArrivedAt) {
        memberJoinedAt[currentUser.email] = leaderArrivedAt;
      } else {
        delete memberJoinedAt[currentUser.email];
      }

      return { ...tracker, leaderArrivedAt, memberJoinedAt };
    });
  }, [currentUser, updateTracker]);
  const toggleEventTrackerTask = useCallback((projectId: string, taskId: string) => updateTracker(projectId, (tracker) => ({ ...tracker, tasks: tracker.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : new Date().toISOString() } : task) })), [updateTracker]);
  const updateEventDelay = useCallback((projectId: string, delayNote: string) => updateTracker(projectId, (tracker) => ({ ...tracker, delayNote })), [updateTracker]);
  const sendEventTrackerMessage = useCallback((projectId: string, message: string, senderRole: "admin" | "team-leader") => updateTracker(projectId, (tracker) => ({ ...tracker, messages: [...tracker.messages, { id: `MSG-${Date.now()}`, sender: currentUser?.name ?? senderRole, senderRole, message, sentAt: new Date().toISOString() }] })), [currentUser, updateTracker]);

  const markEventCompleted = useCallback((projectId: string) => {
    setProjects((current) => current.map((project) => project.id === projectId && project.eventTeam?.some((member) => member.memberEmail === currentUser?.email && (member.userType ?? (member.role === "Team Leader" ? "Team Leader" : "Member")) === "Team Leader")
      ? { ...project, eventTracker: { ...(project.eventTracker ?? { memberJoinedAt: {}, tasks: [], messages: [] }), eventCompletedAt: new Date().toISOString() }, editingWorkflow: project.editingWorkflow ?? { stageProgress: {} } }
      : project));
  }, [currentUser]);

  const assignEditor = useCallback((projectId: string, editorEmail: string) => {
    const editor = editors.find((item) => item.email.toLowerCase() === editorEmail.toLowerCase() && item.editingRoles?.length);
    if (!editor) return;

    setProjects((current) => current.map((project) => project.id === projectId && project.eventTracker?.eventCompletedAt
      ? { ...project, editingWorkflow: { ...(project.editingWorkflow ?? { stageProgress: {} }), assignedEditorEmail: editor.email } }
      : project));
  }, [editors]);

  const updateEditingSetup = useCallback((projectId: string, setup: { sourceDriveUrl: string; adminTimeline: string; timelineDueDate: string; milestones: EditingMilestone[] }) => {
    setProjects((current) => current.map((project) => {
      const workflow = project.editingWorkflow;
      if (project.id !== projectId || !workflow) return project;

      const currentMilestones = getEditingMilestones(workflow);
      const milestones = setup.milestones.map((milestone) => {
        const currentMilestone = currentMilestones.find((item) => item.id === milestone.id);
        return {
          ...milestone,
          label: milestone.label.trim(),
          status: currentMilestone?.status ?? milestone.status,
          updatedAt: currentMilestone?.updatedAt ?? milestone.updatedAt,
        };
      });

      return { ...project, editingWorkflow: { ...workflow, ...setup, milestones } };
    }));
  }, []);

  const sendEditingChatMessage = useCallback((projectId: string, message: string) => {
    const text = message.trim();
    if (!currentUser || !text || !["admin", "client", "editor"].includes(currentUser.role ?? "")) return;

    setProjects((current) => current.map((project) => {
      const workflow = project.editingWorkflow;
      if (project.id !== projectId || !workflow?.assignedEditorEmail) return project;

      const canParticipate = currentUser.role === "admin"
        || (currentUser.role === "client" && project.client.email.toLowerCase() === currentUser.email.toLowerCase())
        || (currentUser.role === "editor" && workflow.assignedEditorEmail.toLowerCase() === currentUser.email.toLowerCase());
      if (!canParticipate) return project;

      const chatMessage: EditingChatMessage = {
        id: `EDIT-MSG-${Date.now()}`,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderRole: currentUser.role as EditingChatMessage["senderRole"],
        message: text,
        sentAt: new Date().toISOString(),
      };

      return { ...project, editingWorkflow: { ...workflow, chatMessages: [...(workflow.chatMessages ?? []), chatMessage] } };
    }));
  }, [currentUser]);

  const markEditorDownloadComplete = useCallback((projectId: string, editorEmail: string) => {
    setProjects((current) => current.map((project) => project.id === projectId && project.editingWorkflow?.assignedEditorEmail === editorEmail
      ? { ...project, editingWorkflow: { ...project.editingWorkflow, downloadCompletedAt: new Date().toISOString() } }
      : project));
  }, []);

  const updateEditingMilestone = useCallback((projectId: string, editorEmail: string, milestoneId: string, status: "NOT_STARTED" | "COMPLETED") => {
    setProjects((current) => current.map((project) => {
      const workflow = project.editingWorkflow;
      if (project.id !== projectId || workflow?.assignedEditorEmail !== editorEmail || !workflow.downloadCompletedAt) return project;
      const milestones = getEditingMilestones(workflow).map((milestone) => milestone.id === milestoneId
        ? { ...milestone, status, updatedAt: new Date().toISOString() }
        : milestone);
      return { ...project, editingWorkflow: { ...workflow, milestones } };
    }));
  }, []);

  const deliverEditedFiles = useCallback((projectId: string, editorEmail: string, finalDriveUrl: string) => {
    setProjects((current) => current.map((project) => project.id === projectId
      && project.editingWorkflow?.assignedEditorEmail === editorEmail
      && Boolean(project.editingWorkflow.downloadCompletedAt)
      && getEditingMilestones(project.editingWorkflow).length > 0
      && getEditingMilestones(project.editingWorkflow).every((milestone) => milestone.status === "COMPLETED")
      && /^https?:\/\//i.test(finalDriveUrl.trim())
      ? { ...project, editingWorkflow: { ...project.editingWorkflow, finalDriveUrl, deliveredAt: new Date().toISOString() } }
      : project));
  }, []);

  const value = useMemo<ProjectContextValue>(
    () => ({
      view,
      setView,
      isLoggedIn,
      isReady,
      activeRole,
      currentUser,
      loginAdmin,
      loginClient,
      loginTeam,
      loginEditor,
      editors,
      editorApplications,
      submitEditorApplication,
      approveEditorApplication,
      rejectEditorApplication,
      createEditor,
      registerTeam,
      teamRegistrations,
      approveTeamRegistration,
      rejectTeamRegistration,
      teamMembers,
      createTeamMember,
      logout,
      projects,
      selectedProjectId,
      setSelectedProjectId,
      createProjectRequest,
      acceptClientRequest,
      submitClientContactDetails,
      resetDemoProjects,
      seedDemoProject,
      sendQuote,
      acceptQuote,
      rejectQuote,
      sendNegotiation,
      acceptNegotiation,
      rejectNegotiation,
      payAdvance,
      requestTeamInterest,
      approveTeamInterest,
      rejectTeamInterest,
      assignTeam,
      assignEventTeam,
      updateClientTeamBrief,
      addEventTrackerTask,
      toggleEventTrackerMember,
      markLeaderArrived,
      toggleEventTrackerTask,
      updateEventDelay,
      sendEventTrackerMessage,
      markEventCompleted,
      assignEditor,
      updateEditingSetup,
      sendEditingChatMessage,
      markEditorDownloadComplete,
      updateEditingMilestone,
      deliverEditedFiles,
    }),
    [acceptClientRequest, acceptNegotiation, acceptQuote, activeRole, addEventTrackerTask, approveEditorApplication, approveTeamInterest, approveTeamRegistration, assignEventTeam, assignEditor, assignTeam, createEditor, createProjectRequest, createTeamMember, currentUser, deliverEditedFiles, editorApplications, editors, isLoggedIn, isReady, loginAdmin, loginClient, loginEditor, loginTeam, logout, markEventCompleted, markLeaderArrived, markEditorDownloadComplete, payAdvance, projects, rejectEditorApplication, rejectNegotiation, rejectQuote, rejectTeamInterest, rejectTeamRegistration, registerTeam, requestTeamInterest, resetDemoProjects, seedDemoProject, selectedProjectId, sendEditingChatMessage, sendEventTrackerMessage, sendNegotiation, sendQuote, submitClientContactDetails, submitEditorApplication, teamMembers, teamRegistrations, toggleEventTrackerMember, toggleEventTrackerTask, updateClientTeamBrief, updateEditingMilestone, updateEditingSetup, updateEventDelay, view],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }

  return context;
}
