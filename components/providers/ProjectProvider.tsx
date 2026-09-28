"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { mockProjects } from "@/data/mockProjects";
import { EDITING_ROLES, type EditingChatMessage, type EditingMilestone, type EditingRole, type EditorAccount, type EventTeamMember, type EventTracker, type EventTrackerTask, type Project, type TeamInterest, type TeamMember, type TeamMemberRole, type TeamRegistration, type ViewMode } from "@/types/project";
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
  resetDemoProjects: () => void;
  seedDemoProject: (scenario: DemoScenario) => void;
  sendQuote: (projectId: string, amount: number, comment: string, advancePercent?: number) => void;
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

const STORAGE_KEYS = {
  projects: "shootatside-projects",
  selectedProjectId: "shootatside-selected-project-id",
  user: "shootatside-current-user",
  roleState: "shootatside-role-state",
  teamRegistrations: "shootatside-team-registrations",
  teamMembers: "shootatside-team-members",
  editors: "shootatside-editors",
} as const;

const DEFAULT_ROLE_STATE = {
  view: "admin" as ViewMode,
  activeRole: "admin" as ViewMode | "guest",
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
  const [view, setView] = useState<ViewMode>("admin");
  const [activeRole, setActiveRole] = useState<ViewMode | "guest">("admin");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(mockProjects[0]?.id ?? "");
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editors, setEditors] = useState<EditorAccount[]>([]);
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
    const storedProjects = readStoredValue<Project[]>(STORAGE_KEYS.projects, mockProjects).map((project) => {
      const leader = project.eventTeam?.find((member) => (member.userType ?? (member.role === "Team Leader" ? "Team Leader" : "Member")) === "Team Leader");
      const eventTracker = project.eventTracker;
      const memberJoinedAt = { ...(eventTracker?.memberJoinedAt ?? {}) };

      if (leader && eventTracker?.leaderArrivedAt && !memberJoinedAt[leader.memberEmail]) {
        memberJoinedAt[leader.memberEmail] = eventTracker.leaderArrivedAt;
      }

      return {
        ...project,
        eventTracker: eventTracker ? { ...eventTracker, memberJoinedAt } : undefined,
        teamInterest: project.teamInterest
          ? Array.isArray(project.teamInterest)
            ? project.teamInterest
            : [project.teamInterest as unknown as TeamInterest]
          : undefined,
      };
    });
    const storedSelectedProject = readStoredValue<string | null>(STORAGE_KEYS.selectedProjectId, mockProjects[0]?.id ?? null);
    const storedTeamRegistrations = readStoredValue<TeamRegistration[]>(STORAGE_KEYS.teamRegistrations, []).map((registration) => ({
      ...registration,
      preferredRoles: registration.preferredRoles ?? [],
    }));
    const storedTeamMembers = readStoredValue<TeamMember[]>(STORAGE_KEYS.teamMembers, []);
    const storedEditors = readStoredValue<EditorAccount[]>(STORAGE_KEYS.editors, []).map((editor) => ({
      ...editor,
      editingRoles: editor.editingRoles ?? [],
    }));
    const editorAccountsByEmail = new Map(storedEditors.map((editor) => [editor.email.toLowerCase(), editor]));

    storedTeamRegistrations.forEach((registration) => {
      const editingRoles = registration.preferredRoles.filter((role): role is EditingRole => EDITING_ROLES.includes(role as EditingRole));
      if (registration.status !== "ACCEPTED" || editingRoles.length === 0 || !registration.username || !registration.password) return;

      const email = registration.email.trim().toLowerCase();
      const existingEditor = editorAccountsByEmail.get(email);
      if (existingEditor) {
        existingEditor.editingRoles = Array.from(new Set([...existingEditor.editingRoles, ...editingRoles]));
        return;
      }

      editorAccountsByEmail.set(email, {
        id: `EDITOR-${registration.id}`,
        name: registration.name,
        email,
        phone: registration.mobile,
        username: registration.username,
        password: registration.password,
        editingRoles,
        createdAt: registration.submittedAt,
      });
    });
    const migratedEditors = Array.from(editorAccountsByEmail.values());

    setView(storedRoleState.view ?? "admin");
    setActiveRole(storedRoleState.activeRole ?? "admin");
    setCurrentUser(normalizedUser);
    setProjects(storedProjects.length > 0 ? storedProjects : mockProjects);
    setSelectedProjectId(storedSelectedProject ?? mockProjects[0]?.id ?? "");
    setTeamRegistrations(storedTeamRegistrations);
    setTeamMembers(storedTeamMembers);
    setEditors(migratedEditors);
    setIsReady(true);
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.projects || event.key === STORAGE_KEYS.selectedProjectId || event.key === STORAGE_KEYS.teamRegistrations || event.key === STORAGE_KEYS.teamMembers || event.key === STORAGE_KEYS.editors || !event.key) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isReady, syncFromStorage]);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady) {
      return;
    }

    writeStoredValue(STORAGE_KEYS.projects, projects);
    writeStoredValue(STORAGE_KEYS.teamRegistrations, teamRegistrations);
    writeStoredValue(STORAGE_KEYS.teamMembers, teamMembers);
    writeStoredValue(STORAGE_KEYS.editors, editors);
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
  }, [activeRole, currentUser, editors, isReady, projects, selectedProjectId, teamMembers, teamRegistrations, view]);

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

    const editingRoles = registration.preferredRoles.filter((role): role is EditingRole => EDITING_ROLES.includes(role as EditingRole));

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
    (input: {
      name: string;
      email: string;
      phone: string;
      eventType: string;
      eventDate: string;
      venue: string;
      requirements: string;
    }) => {
      const generatedProject: Project = {
        id: `PM-${Date.now()}`,
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

      setProjects((current) => [generatedProject, ...current]);
      setSelectedProjectId(generatedProject.id);

      setCurrentUser({ name: input.name, email: input.email, phone: input.phone, role: "client" });
      setActiveRole("client");
      setView("client");
    },
    [],
  );

  const resetDemoProjects = useCallback(() => {
    setProjects(mockProjects);
    setSelectedProjectId(mockProjects[0]?.id ?? "");
  }, []);

  const seedDemoProject = useCallback((scenario: DemoScenario) => {
    const today = new Date();
    const id = `PM-${Date.now()}`;
    const projectBase: Project = {
      id,
      client: {
        id: `CL-${Date.now()}`,
        name: "Demo Client",
        email: "demo.client@example.com",
        phone: "+91 98765 43210",
      },
      eventType: "Wedding",
      eventDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      venue: "Demo Venue, Kolkata",
      requirements: "Sample demo workflow for testing the client-admin lifecycle.",
    };

    const projectMap: Record<DemoScenario, Project> = {
      pending: projectBase,
      quote: {
        ...projectBase,
        initialQuote: {
          amount: 52000,
          comment: "Demo quote has been sent to the client.",
          sentAt: new Date().toISOString(),
        },
      },
      negotiation: {
        ...projectBase,
        clientResponse: {
          type: "REJECTED",
          comment: "Client asked for a lower package amount.",
          respondedAt: new Date().toISOString(),
        },
        negotiation: {
          amount: 43000,
          comment: "Revised package for the client to review.",
          sentAt: new Date().toISOString(),
        },
      },
      confirmed: {
        ...projectBase,
        initialQuote: {
          amount: 61000,
          comment: "Final package quote approved by the client.",
          sentAt: new Date().toISOString(),
        },
        clientResponse: {
          type: "ACCEPTED",
          respondedAt: new Date().toISOString(),
        },
      },
    };

    const generatedProject = projectMap[scenario];
    setProjects((current) => [generatedProject, ...current]);
    setSelectedProjectId(generatedProject.id);
  }, []);

  const sendQuote = useCallback((projectId: string, amount: number, comment: string, advancePercent = 30) => {
    const safeAdvancePercent = Math.min(100, Math.max(0, Number(advancePercent) || 30));
    const advanceAmount = Math.round((amount * safeAdvancePercent) / 100);

    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          initialQuote: {
            amount,
            comment,
            sentAt: new Date().toISOString(),
            advancePercent: safeAdvancePercent,
          },
          payment: {
            advancePercent: safeAdvancePercent,
            amount: advanceAmount,
            status: "PENDING",
          },
          clientResponse: undefined,
          negotiation: undefined,
          negotiationResponse: undefined,
        };
      }),
    );
  }, []);

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
    [acceptNegotiation, acceptQuote, activeRole, addEventTrackerTask, approveTeamInterest, approveTeamRegistration, assignEventTeam, assignEditor, assignTeam, createEditor, createProjectRequest, createTeamMember, currentUser, deliverEditedFiles, editors, isLoggedIn, isReady, loginAdmin, loginClient, loginEditor, loginTeam, logout, markEventCompleted, markLeaderArrived, markEditorDownloadComplete, payAdvance, projects, rejectNegotiation, rejectQuote, rejectTeamInterest, rejectTeamRegistration, registerTeam, requestTeamInterest, resetDemoProjects, seedDemoProject, selectedProjectId, sendEditingChatMessage, sendEventTrackerMessage, sendNegotiation, sendQuote, teamMembers, teamRegistrations, toggleEventTrackerMember, toggleEventTrackerTask, updateClientTeamBrief, updateEditingMilestone, updateEditingSetup, updateEventDelay, view],
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
