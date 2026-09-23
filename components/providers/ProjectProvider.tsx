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
import type { EventTeamMember, EventTracker, EventTrackerTask, Project, TeamInterest, TeamMember, TeamMemberRole, TeamRegistration, ViewMode } from "@/types/project";

type UserRole = "admin" | "client" | "team";

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
    guestCount: number;
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
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  projects: "shootatside-projects",
  selectedProjectId: "shootatside-selected-project-id",
  user: "shootatside-current-user",
  roleState: "shootatside-role-state",
  teamRegistrations: "shootatside-team-registrations",
  teamMembers: "shootatside-team-members",
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

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewMode>("admin");
  const [activeRole, setActiveRole] = useState<ViewMode | "guest">("admin");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(mockProjects[0]?.id ?? "");
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isReady, setIsReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRoleState = readStoredValue<{ view: ViewMode; activeRole: ViewMode | "guest" }>(STORAGE_KEYS.roleState, DEFAULT_ROLE_STATE);
    const storedUser = readStoredValue<SessionUser | null>(STORAGE_KEYS.user, null);
    const normalizedUser = storedUser
      ? {
          name: storedUser.name ?? "",
          email: storedUser.email ?? "",
          phone: storedUser.phone ?? "",
          role: storedUser.role ?? (storedRoleState.activeRole === "admin" ? "admin" : storedRoleState.activeRole === "client" ? "client" : "team"),
        }
      : null;
    const storedProjects = readStoredValue<Project[]>(STORAGE_KEYS.projects, mockProjects).map((project) => ({
      ...project,
      teamInterest: project.teamInterest
        ? Array.isArray(project.teamInterest)
          ? project.teamInterest
          : [project.teamInterest as unknown as TeamInterest]
        : undefined,
    }));
    const storedSelectedProject = readStoredValue<string | null>(STORAGE_KEYS.selectedProjectId, mockProjects[0]?.id ?? null);
    const storedTeamRegistrations = readStoredValue<TeamRegistration[]>(STORAGE_KEYS.teamRegistrations, []).map((registration) => ({
      ...registration,
      userType: registration.userType ?? "Member",
      preferredRoles: registration.preferredRoles ?? [],
    }));
    const storedTeamMembers = readStoredValue<TeamMember[]>(STORAGE_KEYS.teamMembers, []);

    setView(storedRoleState.view ?? "admin");
    setActiveRole(storedRoleState.activeRole ?? "admin");
    setCurrentUser(normalizedUser);
    setProjects(storedProjects.length > 0 ? storedProjects : mockProjects);
    setSelectedProjectId(storedSelectedProject ?? mockProjects[0]?.id ?? "");
    setTeamRegistrations(storedTeamRegistrations);
    setTeamMembers(storedTeamMembers);
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
      if (event.key === STORAGE_KEYS.projects || event.key === STORAGE_KEYS.user || event.key === STORAGE_KEYS.roleState || event.key === STORAGE_KEYS.selectedProjectId || event.key === STORAGE_KEYS.teamRegistrations || event.key === STORAGE_KEYS.teamMembers || !event.key) {
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
    if (selectedProjectId) {
      writeStoredValue(STORAGE_KEYS.selectedProjectId, selectedProjectId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.selectedProjectId);
    }

    if (currentUser) {
      writeStoredValue(STORAGE_KEYS.user, currentUser);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.user);
    }

    writeStoredValue(STORAGE_KEYS.roleState, { view, activeRole });
  }, [activeRole, currentUser, isReady, projects, selectedProjectId, teamMembers, teamRegistrations, view]);

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
    if (!registration) {
      return false;
    }

    setCurrentUser({ name: registration.name, email: registration.email, phone: registration.mobile, role: "team" });
    setActiveRole("team");
    setView("team");
    return true;
  }, [teamRegistrations]);

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
    setTeamRegistrations((current) => current.map((registration) => registration.id === registrationId
      ? { ...registration, username, password, status: "ACCEPTED" }
      : registration));
  }, []);

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
      guestCount: number;
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
        guestCount: input.guestCount,
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
      guestCount: 160,
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
  const markLeaderArrived = useCallback((projectId: string) => updateTracker(projectId, (tracker) => ({ ...tracker, leaderArrivedAt: tracker.leaderArrivedAt ? undefined : new Date().toISOString() })), [updateTracker]);
  const toggleEventTrackerTask = useCallback((projectId: string, taskId: string) => updateTracker(projectId, (tracker) => ({ ...tracker, tasks: tracker.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : new Date().toISOString() } : task) })), [updateTracker]);
  const updateEventDelay = useCallback((projectId: string, delayNote: string) => updateTracker(projectId, (tracker) => ({ ...tracker, delayNote })), [updateTracker]);
  const sendEventTrackerMessage = useCallback((projectId: string, message: string, senderRole: "admin" | "team-leader") => updateTracker(projectId, (tracker) => ({ ...tracker, messages: [...tracker.messages, { id: `MSG-${Date.now()}`, sender: currentUser?.name ?? senderRole, senderRole, message, sentAt: new Date().toISOString() }] })), [currentUser, updateTracker]);

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
    }),
    [acceptNegotiation, acceptQuote, activeRole, addEventTrackerTask, approveTeamInterest, approveTeamRegistration, assignEventTeam, assignTeam, createProjectRequest, createTeamMember, currentUser, isLoggedIn, isReady, loginAdmin, loginClient, loginTeam, logout, markLeaderArrived, payAdvance, projects, rejectNegotiation, rejectQuote, rejectTeamInterest, rejectTeamRegistration, registerTeam, requestTeamInterest, resetDemoProjects, seedDemoProject, selectedProjectId, sendEventTrackerMessage, sendNegotiation, sendQuote, teamMembers, teamRegistrations, toggleEventTrackerMember, toggleEventTrackerTask, updateClientTeamBrief, updateEventDelay, view],
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
