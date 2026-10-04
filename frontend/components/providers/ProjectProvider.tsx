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
import LinearProgress from "@mui/material/LinearProgress";

import { EDITING_ROLES, type ClientContactDetails, type EditingChatMessage, type EditingMilestone, type EditingRole, type EditorAccount, type EditorApplication, type EventTeamMember, type EventTracker, type EventTrackerTask, type Project, type TeamInterest, type TeamMember, type TeamMemberRole, type TeamRegistration, type ViewMode } from "@/types/project";
import { onApiActivity, trackedFetch } from "@/utils/apiActivity";
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
  loginAdmin: (user: SessionUser, token: string) => void;
  loginClient: (email: string, phone: string) => Promise<void>;
  loginTeam: (username: string, password: string) => Promise<boolean>;
  loginEditor: (username: string, password: string) => Promise<boolean>;
  editors: EditorAccount[];
  editorApplications: EditorApplication[];
  submitEditorApplication: (input: Omit<EditorApplication, "id" | "submittedAt" | "status">) => Promise<void>;
  approveEditorApplication: (applicationId: string, username: string, password: string) => Promise<void>;
  rejectEditorApplication: (applicationId: string) => Promise<void>;
  createEditor: (input: Omit<EditorAccount, "id" | "createdAt">) => boolean;
  registerTeam: (input: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => Promise<void>;
  teamRegistrations: TeamRegistration[];
  approveTeamRegistration: (registrationId: string, username: string, password: string) => Promise<void>;
  updateTeamCredentials: (registrationId: string, username: string, password: string) => Promise<void>;
  uploadTeamRegistrationImages: (registrationId: string, uploads: Partial<Pick<TeamRegistration, "aadharFileName" | "aadharDataUrl" | "selfieFileName" | "selfieDataUrl">>) => Promise<void>;
  rejectTeamRegistration: (registrationId: string) => Promise<void>;
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
    budget?: string;
    requirements: string;
  }) => void;
  signContract: (projectId: string, signature: string) => Promise<void>;
  acceptClientRequest: (projectId: string) => Promise<void>;
  submitClientContactDetails: (projectId: string, details: Omit<ClientContactDetails, "submittedAt">) => Promise<void>;
  resetDemoProjects: () => void;
  seedDemoProject: (scenario: DemoScenario) => void;
  sendQuote: (projectId: string, amount: number, comment: string, advancePercent?: number) => Promise<void>;
  acceptQuote: (projectId: string) => Promise<void>;
  rejectQuote: (projectId: string, comment: string) => Promise<void>;
  sendNegotiation: (projectId: string, amount: number, comment: string, advancePercent?: number) => void;
  acceptNegotiation: (projectId: string) => Promise<void>;
  rejectNegotiation: (projectId: string, comment: string) => Promise<void>;
  payAdvance: (projectId: string, screenshotDataUrl: string, screenshotFileName: string) => Promise<void>;
  verifyAdvancePayment: (projectId: string) => Promise<void>;
  requestTeamInterest: (projectId: string) => Promise<string | null>;
  approveTeamInterest: (projectId: string, memberEmail: string) => Promise<void>;
  rejectTeamInterest: (projectId: string, memberEmail: string) => Promise<void>;
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
  token: "shootatside-auth-token",
  roleState: "shootatside-role-state",
} as const;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await trackedFetch(`${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(typeof window !== "undefined" && readSessionValue<string | null>(STORAGE_KEYS.token, null)
        ? { Authorization: `Bearer ${readSessionValue<string>(STORAGE_KEYS.token, "")}` }
        : {}),
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
  const [activeApiRequests, setActiveApiRequests] = useState(0);

  useEffect(() => onApiActivity((active) => {
    setActiveApiRequests((count) => Math.max(0, count + (active ? 1 : -1)));
  }), []);

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

  const loadFromApi = useCallback(async (role: UserRole | null = currentUser?.role ?? null) => {
    try {
      const [projectsResponse, appsResponse, registrationsResponse] = await Promise.all([
        fetchApi<Project[]>("/projects").catch(() => []),
        role === "admin" ? fetchApi<EditorApplication[]>("/editor/applications").catch(() => []) : Promise.resolve([]),
        role === "admin" ? fetchApi<TeamRegistration[]>("/team/registrations").catch(() => []) : Promise.resolve([]),
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
  }, [currentUser?.role]);

  useEffect(() => {
    if (!isReady || !currentUser || !readSessionValue<string | null>(STORAGE_KEYS.token, null)) return;
    const timer = window.setTimeout(() => void loadFromApi(currentUser.role ?? null), 0);
    return () => window.clearTimeout(timer);
  }, [currentUser, isReady, loadFromApi]);

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

  const loginAdmin = useCallback((user: SessionUser, token: string) => {
    writeSessionValue(STORAGE_KEYS.token, token);
    setCurrentUser({ ...user, role: "admin" });
    setActiveRole("admin");
    setView("admin");
  }, []);

  const loginClient = useCallback(async (email: string, phone: string) => {
    const response = await fetchApi<{ ok: boolean; user: SessionUser; token: string }>("/auth/client/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), phone: phone.trim() }),
    });
    writeSessionValue(STORAGE_KEYS.token, response.token);
    setCurrentUser({ ...response.user, phone: response.user.phone ?? "", role: "client" });
    setActiveRole("client");
    setView("client");
  }, []);

  const loginTeam = useCallback(async (username: string, password: string) => {
    const response = await fetchApi<{ ok: boolean; user: SessionUser; token: string }>("/auth/team/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    writeSessionValue(STORAGE_KEYS.token, response.token);
    setCurrentUser({ ...response.user, phone: response.user.phone ?? "", role: "team" });
    setActiveRole("team");
    setView("team");
    return true;
  }, []);

  const loginEditor = useCallback(async (username: string, password: string) => {
    const response = await fetchApi<{ ok: boolean; user: SessionUser; token: string }>("/auth/editor/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    writeSessionValue(STORAGE_KEYS.token, response.token);
    setCurrentUser({ ...response.user, phone: response.user.phone ?? "", role: "editor" });
    setActiveRole("editor");
    setView("editor");
    return true;
  }, []);

  const createEditor = useCallback((input: Omit<EditorAccount, "id" | "createdAt">) => {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    if (editors.some((editor) => editor.email.toLowerCase() === email || editor.username.toLowerCase() === username.toLowerCase())) {
      return false;
    }

    setEditors((current) => [{ ...input, email: input.email.trim().toLowerCase(), id: `EDITOR-${Date.now()}`, createdAt: new Date().toISOString() }, ...current]);
    return true;
  }, [editors]);

  const submitEditorApplication = useCallback(async (input: Omit<EditorApplication, "id" | "submittedAt" | "status">) => {
    const email = input.email.trim().toLowerCase();
    if (!email || input.editingRoles.length === 0 || !input.aadharDataUrl || !input.selfieDataUrl) {
      throw new Error("Email, editing specialties, ID image, and selfie are required.");
    }
    if (editors.some((editor) => editor.email.toLowerCase() === email)
      || editorApplications.some((application) => application.email.toLowerCase() === email && application.status !== "REJECTED")) {
      throw new Error("An application or editor account already exists for this email.");
    }

    const response = await fetchApi<{ ok: boolean; application: EditorApplication }>("/editor/applications", {
      method: "POST",
      body: JSON.stringify({ ...input, email }),
    });
    setEditorApplications((current) => [response.application, ...current.filter((application) => application.id !== response.application.id)]);
  }, [editorApplications, editors]);

  const approveEditorApplication = useCallback(async (applicationId: string, username: string, password: string) => {
    const application = editorApplications.find((item) => item.id === applicationId && item.status === "PENDING");
    const normalizedUsername = username.trim();
    if (!application || !normalizedUsername || !password.trim()) throw new Error("Set a username and password before approving.");
    if (editors.some((editor) => editor.email.toLowerCase() === application.email.toLowerCase() || editor.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      throw new Error("An editor with this email or username already exists.");
    }

    const response = await fetchApi<{ ok: boolean; application: EditorApplication }>(`/editor/applications/${encodeURIComponent(applicationId)}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ username: normalizedUsername, password }),
    });
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
    setEditorApplications((current) => current.map((item) => item.id === applicationId ? response.application : item));
  }, [editorApplications, editors]);

  const rejectEditorApplication = useCallback(async (applicationId: string) => {
    const response = await fetchApi<{ ok: boolean; application: EditorApplication }>(`/editor/applications/${encodeURIComponent(applicationId)}/reject`, {
      method: "PATCH",
    });
    setEditorApplications((current) => current.map((item) => item.id === applicationId ? response.application : item));
  }, []);

  const registerTeam = useCallback(async (input: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    const response = await fetchApi<{ ok: boolean; registration: TeamRegistration }>("/team/registrations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setTeamRegistrations((current) => [response.registration, ...current.filter((registration) => registration.id !== response.registration.id)]);
  }, []);

  const approveTeamRegistration = useCallback(async (registrationId: string, username: string, password: string) => {
    const registration = teamRegistrations.find((item) => item.id === registrationId);
    if (!registration) throw new Error("Team registration was not found.");
    const response = await fetchApi<{ ok: boolean; registration: TeamRegistration }>(`/team/registrations/${encodeURIComponent(registrationId)}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const editingRoles = (registration.preferredRoles as Array<TeamMemberRole | EditingRole>).filter((role): role is EditingRole => EDITING_ROLES.includes(role as EditingRole));

    setTeamRegistrations((current) => current.map((item) => item.id === registrationId ? response.registration : item));

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

  const updateTeamCredentials = useCallback(async (registrationId: string, username: string, password: string) => {
    const response = await fetchApi<{ ok: boolean; registration: TeamRegistration }>(`/team/registrations/${encodeURIComponent(registrationId)}/credentials`, {
      method: "PATCH",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setTeamRegistrations((current) => current.map((registration) => registration.id === registrationId ? response.registration : registration));
  }, []);

  const uploadTeamRegistrationImages = useCallback(async (registrationId: string, uploads: Partial<Pick<TeamRegistration, "aadharFileName" | "aadharDataUrl" | "selfieFileName" | "selfieDataUrl">>) => {
    const response = await fetchApi<{ ok: boolean; registration: TeamRegistration }>(`/team/registrations/${encodeURIComponent(registrationId)}/uploads`, {
      method: "PATCH",
      body: JSON.stringify(uploads),
    });
    setTeamRegistrations((current) => current.map((registration) => registration.id === registrationId ? response.registration : registration));
  }, []);

  const rejectTeamRegistration = useCallback(async (registrationId: string) => {
    const response = await fetchApi<{ ok: boolean; registration: TeamRegistration }>(`/team/registrations/${encodeURIComponent(registrationId)}/reject`, {
      method: "PATCH",
    });
    setTeamRegistrations((current) => current.map((registration) => registration.id === registrationId ? response.registration : registration));
  }, []);

  const createTeamMember = useCallback((input: { name: string; role: TeamMemberRole; email: string; phone: string }) => {
    setTeamMembers((current) => [{ ...input, id: `MEMBER-${Date.now()}`, createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const logout = useCallback(() => {
    writeSessionValue(STORAGE_KEYS.token, null);
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
      budget?: string;
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
        budget: input.budget,
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
          budget: input.budget,
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

  const acceptClientRequest = useCallback(async (projectId: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/accept-request`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const submitClientContactDetails = useCallback(async (projectId: string, details: Omit<ClientContactDetails, "submittedAt">) => {
    if (!currentUser || currentUser.role !== "client") return;
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/contract-details`, {
      method: "PATCH",
      body: JSON.stringify(details),
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, [currentUser]);

  const signContract = useCallback(async (projectId: string, signature: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/contract-sign`, {
      method: "PATCH",
      body: JSON.stringify({ signature }),
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const acceptQuote = useCallback(async (projectId: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/accept-quote`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const rejectQuote = useCallback(async (projectId: string, comment: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/reject-quote`, {
      method: "PATCH",
      body: JSON.stringify({ comment }),
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
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

  const acceptNegotiation = useCallback(async (projectId: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/accept-negotiation`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const payAdvance = useCallback(async (projectId: string, screenshotDataUrl: string, screenshotFileName: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/pay-advance`, {
      method: "PATCH",
      body: JSON.stringify({ screenshotDataUrl, screenshotFileName }),
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const verifyAdvancePayment = useCallback(async (projectId: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/verify-payment`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const requestTeamInterest = useCallback(async (projectId: string) => {
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

    try {
      const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/team-interest`, {
        method: "POST",
        body: JSON.stringify({ member: currentUser.name, memberEmail: currentUser.email }),
      });
      setProjects((current) => current.map((item) => item.id === projectId ? response.project : item));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Unable to submit interest. Please try again.";
    }
  }, [currentUser, projects]);

  const approveTeamInterest = useCallback(async (projectId: string, memberEmail: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/team-interest/${encodeURIComponent(memberEmail)}/approve`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const rejectTeamInterest = useCallback(async (projectId: string, memberEmail: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/team-interest/${encodeURIComponent(memberEmail)}/reject`, {
      method: "PATCH",
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
  }, []);

  const rejectNegotiation = useCallback(async (projectId: string, comment: string) => {
    const response = await fetchApi<{ ok: boolean; project: Project }>(`/projects/${encodeURIComponent(projectId)}/reject-negotiation`, {
      method: "PATCH",
      body: JSON.stringify({ comment }),
    });
    setProjects((current) => current.map((project) => project.id === projectId ? response.project : project));
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
      updateTeamCredentials,
      uploadTeamRegistrationImages,
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
      signContract,
      resetDemoProjects,
      seedDemoProject,
      sendQuote,
      acceptQuote,
      rejectQuote,
      sendNegotiation,
      acceptNegotiation,
      rejectNegotiation,
      payAdvance,
      verifyAdvancePayment,
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
    [acceptClientRequest, acceptNegotiation, acceptQuote, activeRole, addEventTrackerTask, approveEditorApplication, approveTeamInterest, approveTeamRegistration, assignEventTeam, assignEditor, assignTeam, createEditor, createProjectRequest, createTeamMember, currentUser, deliverEditedFiles, editorApplications, editors, isLoggedIn, isReady, loginAdmin, loginClient, loginEditor, loginTeam, logout, markEventCompleted, markLeaderArrived, markEditorDownloadComplete, payAdvance, projects, rejectEditorApplication, rejectNegotiation, rejectQuote, rejectTeamInterest, rejectTeamRegistration, registerTeam, requestTeamInterest, resetDemoProjects, seedDemoProject, selectedProjectId, sendEditingChatMessage, sendEventTrackerMessage, sendNegotiation, sendQuote, signContract, submitClientContactDetails, submitEditorApplication, teamMembers, teamRegistrations, toggleEventTrackerMember, toggleEventTrackerTask, updateClientTeamBrief, updateEditingMilestone, updateEditingSetup, updateEventDelay, updateTeamCredentials, uploadTeamRegistrationImages, verifyAdvancePayment, view],
  );

  return <ProjectContext.Provider value={value}>
    {activeApiRequests > 0 ? <LinearProgress className="global-api-progress" aria-label="Loading" /> : null}
    {children}
  </ProjectContext.Provider>;
}

export function useProjectContext() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }

  return context;
}
