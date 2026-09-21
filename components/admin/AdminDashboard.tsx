"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/common/Modal";
import { ProjectTable } from "@/components/common/ProjectTable";
import { ProjectTimeline } from "@/components/common/ProjectTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TEAM_MEMBER_ROLES, type TeamMemberRole } from "@/types/project";
import { formatCurrency, formatDate } from "@/utils/status";

function TeamHierarchyBuilder() {
  const { projects, teamRegistrations, assignEventTeam } = useProjectContext();
  const [date, setDate] = useState("");
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { kind: "interested" | "custom"; memberEmail: string; name: string; phone: string; role: TeamMemberRole }[]>>({});

  return <div className="panel">
    <div className="panel-header"><div><h3>Team Hierarchy</h3><p className="form-note">Add interested members or create custom team members for each event.</p></div><label><span>Filter by event date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div>
    <div className="event-hierarchy-list">{projects.filter((project) => !date || project.eventDate === date).map((project) => {
      const interested = (project.teamInterest ?? []).map((interest) => ({ interest, registration: teamRegistrations.find((registration) => registration.email === interest.memberEmail) })).filter((item) => item.registration);
      const rows = drafts[project.id] ?? project.eventTeam?.map((member) => ({ kind: "custom" as const, memberEmail: member.memberEmail, name: member.member, phone: member.memberPhone ?? "", role: member.role })) ?? [];
      const updateRows = (nextRows: typeof rows) => setDrafts((current) => ({ ...current, [project.id]: nextRows }));
      const addInterested = () => {
        const option = interested.find((item) => !rows.some((row) => row.memberEmail === item.interest.memberEmail));
        if (!option) return;
        updateRows([...rows, { kind: "interested", memberEmail: option.interest.memberEmail, name: option.interest.member, phone: option.registration?.mobile ?? "", role: option.registration?.preferredRoles[0] ?? TEAM_MEMBER_ROLES[0] }]);
      };
      const addCustom = () => updateRows([...rows, { kind: "custom", memberEmail: `manual-${Date.now()}`, name: "", phone: "", role: TEAM_MEMBER_ROLES[0] }]);
      return <article className="hierarchy-event" key={project.id}>
        <div className="hierarchy-event-header"><div><p className="eyebrow">{project.id}</p><h3>{project.client.name} · {project.eventType}</h3><p>{formatDate(project.eventDate)} · {project.venue}</p></div><button type="button" className="primary-button" onClick={() => setOpenEvent((current) => current === project.id ? null : project.id)}>Make My Team</button></div>
        <div className="hierarchy-interests"><strong>Interested members</strong>{interested.length === 0 ? <span>No team member interest yet.</span> : interested.map(({ interest }) => <span className="pill" key={interest.memberEmail}>{interest.member} · {interest.status}</span>)}</div>
        {openEvent === project.id ? <div className="hierarchy-builder">
          {rows.length > 0 ? <div className="hierarchy-field-labels"><span>Type</span><span>Name</span><span>Phone Number</span><span>Role</span><span>Action</span></div> : null}
          {rows.map((row, index) => {
            const selected = interested.find((item) => item.interest.memberEmail === row.memberEmail);
            const roles = row.kind === "interested" ? selected?.registration?.preferredRoles ?? [] : TEAM_MEMBER_ROLES;
            return <div className="hierarchy-member-row" key={`${row.memberEmail}-${index}`}>
              <strong className="hierarchy-row-kind">{row.kind === "interested" ? "Interested" : "Custom"}</strong>
              {row.kind === "interested" ? <><select aria-label={`Interested member ${index + 1}`} value={row.memberEmail} onChange={(event) => { const next = interested.find((item) => item.interest.memberEmail === event.target.value); updateRows(rows.map((item, rowIndex) => rowIndex === index ? { ...item, memberEmail: event.target.value, name: next?.interest.member ?? "", phone: next?.registration?.mobile ?? "", role: next?.registration?.preferredRoles[0] ?? TEAM_MEMBER_ROLES[0] } : item)); }}>{interested.map(({ interest }) => <option key={interest.memberEmail} value={interest.memberEmail}>{interest.member}</option>)}</select><input aria-label={`Interested member name ${index + 1}`} value={row.name} disabled /><input aria-label={`Interested member phone ${index + 1}`} value={row.phone} disabled /></> : <><input aria-label={`Custom member name ${index + 1}`} placeholder="Name" value={row.name} onChange={(event) => updateRows(rows.map((item, rowIndex) => rowIndex === index ? { ...item, name: event.target.value } : item))} /><input aria-label={`Custom member phone ${index + 1}`} placeholder="Phone number" value={row.phone} onChange={(event) => updateRows(rows.map((item, rowIndex) => rowIndex === index ? { ...item, phone: event.target.value } : item))} /></>}
              <select aria-label={`Role ${index + 1}`} value={row.role} onChange={(event) => updateRows(rows.map((item, rowIndex) => rowIndex === index ? { ...item, role: event.target.value as TeamMemberRole } : item))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select><button type="button" className="danger-button" onClick={() => updateRows(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
            </div>;
          })}
          <div className="hierarchy-builder-actions"><div className="hierarchy-add-actions"><button type="button" className="secondary-button hierarchy-add-button" onClick={addInterested}>Add Interested Member</button><button type="button" className="secondary-button hierarchy-add-button" onClick={addCustom}>Add Team Member</button></div><button type="button" className="success-button" onClick={() => assignEventTeam(project.id, rows.map((row) => ({ memberEmail: row.memberEmail, member: row.name, memberPhone: row.phone, role: row.role, date: project.eventDate, camera: "", gear: "", notes: "" })))}>Save Team</button></div>
        </div> : null}
        {project.eventTeam?.length ? <div className="team-hierarchy-graph"><div className="panel-header"><h3>Team Hierarchy Graph</h3><span className="pill">Leader to members</span></div>{(() => { const members = project.eventTeam ?? []; const leaders = members.filter((member) => member.role === "Team Leader"); const crew = members.filter((member) => member.role !== "Team Leader"); return <div className="hierarchy-graph-event"><div className="hierarchy-graph-root"><strong>{project.eventType}</strong><span>{formatDate(project.eventDate)} · {project.client.name}</span></div><div className="hierarchy-graph-line" />{leaders.length > 0 ? <div className="hierarchy-graph-leaders">{leaders.map((leader) => <div className="hierarchy-graph-person leader" key={`${project.id}-${leader.memberEmail}-${leader.role}`}><strong>{leader.member}</strong><span>{leader.memberPhone || "Phone not provided"}</span><small>{leader.role}</small></div>)}</div> : <div className="empty-state small">No Team Leader assigned.</div>}<div className="hierarchy-graph-line" />{crew.length > 0 ? <div className="hierarchy-graph-crew">{crew.map((member) => <div className="hierarchy-graph-person" key={`${project.id}-${member.memberEmail}-${member.role}`}><strong>{member.member}</strong><span>{member.memberPhone || "Phone not provided"}</span><small>{member.role}</small></div>)}</div> : null}</div>; })()}</div> : null}
      </article>;
    })}</div>
  </div>;
}

function TeamManagementPanel() {
  const { projects, approveTeamInterest, rejectTeamInterest, teamRegistrations, approveTeamRegistration, rejectTeamRegistration, assignEventTeam } = useProjectContext();
  const [credentials, setCredentials] = useState<Record<string, { username: string; password: string }>>({});
  const [activeSubsection, setActiveSubsection] = useState<"registrations" | "interests" | "hierarchy" | "hierarchy-builder">("registrations");
  const [interestDate, setInterestDate] = useState("");
  const [hierarchyDate, setHierarchyDate] = useState("");
  const [openTeamEventId, setOpenTeamEventId] = useState<string | null>(null);
  const [teamDrafts, setTeamDrafts] = useState<Record<string, { memberEmail: string; member: string; memberPhone: string; role: TeamMemberRole }[]>>({});
  const requests = projects.flatMap((project) => (project.teamInterest ?? [])
    .filter(() => !interestDate || project.eventDate === interestDate)
    .map((interest) => ({ project, interest })));

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h2>Team Management</h2>
        </div>
        <span className="pill">{requests.length} interest requests</span>
      </section>

      <div className="team-submenu" aria-label="Team management sections">
        <button type="button" className={activeSubsection === "registrations" ? "admin-nav-button active" : "admin-nav-button"} onClick={() => setActiveSubsection("registrations")}>Team Registration</button>
        <button type="button" className={activeSubsection === "interests" ? "admin-nav-button active" : "admin-nav-button"} onClick={() => setActiveSubsection("interests")}>Interest Requests</button>
        <button type="button" className={activeSubsection === "hierarchy-builder" ? "admin-nav-button active" : "admin-nav-button"} onClick={() => setActiveSubsection("hierarchy-builder")}>Team Hierarchy</button>
      </div>

      {activeSubsection === "registrations" ? <div className="panel">
        <div className="panel-header">
          <h3>Team Registrations</h3>
          <span className="pill">{teamRegistrations.length} applications</span>
        </div>
        {teamRegistrations.length === 0 ? (
          <div className="empty-state">No team registration applications yet.</div>
        ) : (
          <div className="team-registration-list">
            {teamRegistrations.map((registration) => {
              const formValues = credentials[registration.id] ?? { username: "", password: "" };
              return (
                <article className="team-registration-item" key={registration.id}>
                  <div className="team-registration-heading">
                    <div><p className="eyebrow">{registration.id}</p><h3>{registration.name}</h3><p>{registration.email} · {registration.mobile}</p></div>
                    <span className="pill">{registration.status}</span>
                  </div>
                  <div className="team-registration-details">
                    <span>WhatsApp: {registration.whatsapp}</span><span>PhonePe: {registration.phonePe}</span><span>Address: {registration.address}</span>
                    <span>Aadhar: {registration.aadharFileName}</span><span>Selfie: {registration.selfieFileName}</span>
                    <span>Preferred roles: {registration.preferredRoles?.join(", ") || "Not selected"}</span>
                  </div>
                  {registration.status === "PENDING" ? <div className="team-registration-actions">
                    <input aria-label={`Username for ${registration.name}`} placeholder="Set username" value={formValues.username} onChange={(event) => setCredentials((current) => ({ ...current, [registration.id]: { ...formValues, username: event.target.value } }))} />
                    <input aria-label={`Password for ${registration.name}`} type="password" placeholder="Set password" value={formValues.password} onChange={(event) => setCredentials((current) => ({ ...current, [registration.id]: { ...formValues, password: event.target.value } }))} />
                    <button type="button" className="success-button" onClick={() => {
                      if (formValues.username.trim() && formValues.password.trim()) approveTeamRegistration(registration.id, formValues.username.trim(), formValues.password);
                    }}>Accept &amp; Set Login</button>
                    <button type="button" className="danger-button" onClick={() => rejectTeamRegistration(registration.id)}>Reject</button>
                  </div> : null}
                </article>
              );
            })}
          </div>
        )}
      </div> : null}

      {activeSubsection === "interests" ? <div className="panel">
        <div className="panel-header">
          <h3>Team Interest Requests</h3>
          <input aria-label="Filter interest requests by event date" type="date" value={interestDate} onChange={(event) => setInterestDate(event.target.value)} />
        </div>
        {requests.length === 0 ? (
          <div className="empty-state">No team members have requested event access.</div>
        ) : (
          <div className="team-request-list">
            {requests.map(({ project, interest }) => {
              return (
                <article className="team-request" key={`${project.id}-${interest.memberEmail}`}>
                  <div>
                    <p className="eyebrow">{project.id}</p>
                    <h3>{interest.member}</h3>
                    <p>{project.eventType} · {formatDate(project.eventDate)} · {project.venue}</p>
                  </div>
                  <div className="team-request-actions">
                    <span className="pill">{interest.status}</span>
                    {interest.status === "PENDING" ? (
                      <>
                        <button type="button" className="success-button" onClick={() => approveTeamInterest(project.id, interest.memberEmail)}>Accept Request</button>
                        <button type="button" className="danger-button" onClick={() => rejectTeamInterest(project.id, interest.memberEmail)}>Reject</button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div> : null}

      {activeSubsection === "hierarchy-builder" ? <TeamHierarchyBuilder /> : null}

      {activeSubsection === "hierarchy" ? <div className="panel">
        <div className="panel-header"><div><h3>Team Hierarchy</h3><p className="form-note">Build a separate team for each event from members who showed interest.</p></div><input aria-label="Filter hierarchy events by date" type="date" value={hierarchyDate} onChange={(event) => setHierarchyDate(event.target.value)} /></div>
        <div className="event-hierarchy-list">
          {projects.filter((project) => !hierarchyDate || project.eventDate === hierarchyDate).map((project) => {
            const interestedMembers = (project.teamInterest ?? []).map((interest) => ({ interest, registration: teamRegistrations.find((registration) => registration.email === interest.memberEmail) })).filter((item) => item.registration);
            const draft = teamDrafts[project.id] ?? project.eventTeam?.map((member) => ({ memberEmail: member.memberEmail, member: member.member, memberPhone: member.memberPhone ?? "", role: member.role })) ?? [];
            const addMember = () => {
              const available = interestedMembers.find((item) => !draft.some((member) => member.memberEmail === item.interest.memberEmail));
              const preferredRole = available?.registration?.preferredRoles[0];
              if (!available || !preferredRole) return;
              setTeamDrafts((current) => ({ ...current, [project.id]: [...draft, { memberEmail: available.interest.memberEmail, member: available.interest.member, memberPhone: available.registration?.mobile ?? "", role: preferredRole }] }));
            };
            return <article className="hierarchy-event" key={project.id}>
              <div className="hierarchy-event-header"><div><p className="eyebrow">{project.id}</p><h3>{project.client.name} · {project.eventType}</h3><p>{formatDate(project.eventDate)} · {project.venue}</p></div><button type="button" className="primary-button" onClick={() => setOpenTeamEventId((current) => current === project.id ? null : project.id)}>Make My Team</button></div>
              <div className="hierarchy-interests"><strong>Interested members</strong>{interestedMembers.length === 0 ? <span>No team member interest yet.</span> : interestedMembers.map(({ interest }) => <span className="pill" key={interest.memberEmail}>{interest.member} · {interest.status}</span>)}</div>
              {openTeamEventId === project.id ? <div className="hierarchy-builder">
                <div className="hierarchy-field-labels"><span>Name</span><span>Phone Number</span><span>Interested Member</span><span>Role</span></div>
                {draft.map((member, index) => { const interested = interestedMembers.find((item) => item.interest.memberEmail === member.memberEmail); const roles = interested?.registration?.preferredRoles ?? TEAM_MEMBER_ROLES; return <div className="hierarchy-member-row" key={`${member.memberEmail}-${index}`}><input aria-label={`Team member name ${index + 1}`} value={member.member} onChange={(event) => setTeamDrafts((current) => ({ ...current, [project.id]: draft.map((item, itemIndex) => itemIndex === index ? { ...item, member: event.target.value } : item) }))} /><input aria-label={`Team member phone ${index + 1}`} value={member.memberPhone} onChange={(event) => setTeamDrafts((current) => ({ ...current, [project.id]: draft.map((item, itemIndex) => itemIndex === index ? { ...item, memberPhone: event.target.value } : item) }))} /><select aria-label={`Team member ${index + 1}`} value={member.memberEmail} onChange={(event) => setTeamDrafts((current) => ({ ...current, [project.id]: draft.map((item, itemIndex) => itemIndex === index ? { ...item, memberEmail: event.target.value, member: interestedMembers.find((candidate) => candidate.interest.memberEmail === event.target.value)?.interest.member ?? item.member, memberPhone: interestedMembers.find((candidate) => candidate.interest.memberEmail === event.target.value)?.registration?.mobile ?? item.memberPhone, role: interestedMembers.find((candidate) => candidate.interest.memberEmail === event.target.value)?.registration?.preferredRoles[0] ?? item.role } : item) }))}>{interestedMembers.map(({ interest }) => <option key={interest.memberEmail} value={interest.memberEmail}>{interest.member}</option>)}</select><select aria-label={`Role for team member ${index + 1}`} value={member.role} onChange={(event) => setTeamDrafts((current) => ({ ...current, [project.id]: draft.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value as TeamMemberRole } : item) }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select><button type="button" className="danger-button" onClick={() => setTeamDrafts((current) => ({ ...current, [project.id]: draft.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div>; })}
                <div className="hierarchy-builder-actions"><button type="button" className="secondary-button" onClick={addMember}>Add Interested Member</button><button type="button" className="secondary-button" onClick={() => setTeamDrafts((current) => ({ ...current, [project.id]: [...draft, { memberEmail: `manual-${Date.now()}`, member: "", memberPhone: "", role: TEAM_MEMBER_ROLES[0] }] }))}>Add Team Member</button><button type="button" className="success-button" onClick={() => assignEventTeam(project.id, draft.map((member) => ({ ...member, date: project.eventDate, camera: "", gear: "", notes: "" })))}>Save Team</button></div>
              </div> : null}
            </article>;
          })}
        </div>
        <div className="team-visual-graph">
          <div className="panel-header"><h3>Whole Team Graph</h3><span className="pill">Event assignments</span></div>
          {projects.filter((project) => project.eventTeam?.length).length === 0 ? <div className="empty-state">Save an event team to see the visual graph.</div> : <div className="team-graph-events">{projects.filter((project) => project.eventTeam?.length).map((project) => <div className="team-graph-event" key={project.id}><div className="team-graph-event-node"><strong>{project.eventType}</strong><span>{formatDate(project.eventDate)}</span></div><div className="team-graph-connector" /><div className="team-graph-members">{project.eventTeam?.map((member) => <div className="team-graph-member-node" key={`${project.id}-${member.memberEmail}-${member.role}`}><strong>{member.member}</strong><span>{member.role}</span></div>)}</div></div>)}</div>}
        </div>
      </div> : null}
    </div>
  );
}

export function AdminDashboard() {
  const { projects, selectedProjectId, setSelectedProjectId, sendQuote, sendNegotiation, assignTeam, resetDemoProjects, seedDemoProject } = useProjectContext();
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteComment, setQuoteComment] = useState("");
  const [quoteAdvancePercent, setQuoteAdvancePercent] = useState("30");
  const [quoteError, setQuoteError] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState("");
  const [negotiationAmount, setNegotiationAmount] = useState("");
  const [negotiationComment, setNegotiationComment] = useState("");
  const [negotiationAdvancePercent, setNegotiationAdvancePercent] = useState("30");
  const [negotiationError, setNegotiationError] = useState("");
  const [negotiationSuccess, setNegotiationSuccess] = useState("");
  const [isTimelineOpen, setTimelineOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    member: "",
    date: "",
    camera: "",
    gear: "",
    notes: "",
  });
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [activeSection, setActiveSection] = useState<"dashboard" | "team-management">("dashboard");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );

  if (!selectedProject) {
    return <div className="empty-state">No projects available.</div>;
  }

  const counts = {
    totalInquiries: projects.length,
    upcomingEvents: projects.filter((project) => new Date(project.eventDate) >= new Date()).length,
    activeBookings: projects.filter((project) => project.initialQuote && !project.negotiationResponse && !project.clientResponse).length,
    pendingWorkflows: projects.filter((project) => !project.initialQuote || project.clientResponse?.type === "REJECTED").length,
  };

  const handleSendQuote = () => {
    const amount = Number(quoteAmount);
    const advancePercent = Number(quoteAdvancePercent);

    if (!quoteAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setQuoteError("Quote amount is required and must be greater than 0.");
      setQuoteSuccess("");
      return;
    }

    if (Number.isNaN(advancePercent) || advancePercent < 0 || advancePercent > 100) {
      setQuoteError("Advance payment percentage must be between 0 and 100.");
      setQuoteSuccess("");
      return;
    }

    if (!quoteComment.trim()) {
      setQuoteError("Please add a quote comment before sending.");
      setQuoteSuccess("");
      return;
    }

    sendQuote(selectedProject.id, amount, quoteComment.trim(), advancePercent);
    setQuoteError("");
    setQuoteSuccess("Quote sent successfully.");
    setQuoteAmount("");
    setQuoteComment("");
    setQuoteAdvancePercent("30");
  };

  const handleSendNegotiation = () => {
    const amount = Number(negotiationAmount);
    const advancePercent = Number(negotiationAdvancePercent);

    if (!negotiationAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setNegotiationError("Negotiation amount is required and must be greater than 0.");
      setNegotiationSuccess("");
      return;
    }

    if (Number.isNaN(advancePercent) || advancePercent < 0 || advancePercent > 100) {
      setNegotiationError("Advance payment percentage must be between 0 and 100.");
      setNegotiationSuccess("");
      return;
    }

    if (!negotiationComment.trim()) {
      setNegotiationError("Please add a negotiation comment before sending.");
      setNegotiationSuccess("");
      return;
    }

    sendNegotiation(selectedProject.id, amount, negotiationComment.trim(), advancePercent);
    setNegotiationError("");
    setNegotiationSuccess("Negotiation sent successfully.");
    setNegotiationAmount("");
    setNegotiationComment("");
    setNegotiationAdvancePercent("30");
  };

  const handleAssignTeam = () => {
    if (!assignmentForm.member.trim() || !assignmentForm.date || !assignmentForm.camera.trim()) {
      setAssignmentError("Please provide the team member, shoot date, and camera details.");
      setAssignmentSuccess("");
      return;
    }

    assignTeam(selectedProject.id, assignmentForm);
    setAssignmentError("");
    setAssignmentSuccess("Team assignment saved successfully.");
  };

  return (
    <div className="admin-portal-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Admin Portal</div>
        <button type="button" className={activeSection === "dashboard" ? "admin-nav-button active" : "admin-nav-button"} onClick={() => setActiveSection("dashboard")}>
          Dashboard
        </button>
        <button type="button" className={activeSection === "team-management" ? "admin-nav-button active" : "admin-nav-button"} onClick={() => setActiveSection("team-management")}>
          Team Management
        </button>
        {activeSection === "team-management" ? <div className="admin-sidebar-submenu"><span>Team Registration</span><span>Interest Requests</span><span>Team Hierarchy</span></div> : null}
      </aside>

      <main className="admin-portal-main">
      {activeSection === "team-management" ? <TeamManagementPanel /> : <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Photography Admin</p>
          <h2>Dashboard</h2>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Inquiries</span>
          <strong>{counts.totalInquiries}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming Events</span>
          <strong>{counts.upcomingEvents}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Bookings</span>
          <strong>{counts.activeBookings}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Workflows</span>
          <strong>{counts.pendingWorkflows}</strong>
        </div>
      </div>

      <div className="demo-controls card">
        <div className="demo-controls-header">
          <h3>Play with Demo Data</h3>
        </div>
        <div className="demo-actions">
          <button type="button" className="demo-button" onClick={() => seedDemoProject("pending")}>Pending</button>
          <button type="button" className="demo-button" onClick={() => seedDemoProject("quote")}>Quote Sent</button>
          <button type="button" className="demo-button" onClick={() => seedDemoProject("negotiation")}>Negotiation</button>
          <button type="button" className="demo-button" onClick={() => seedDemoProject("confirmed")}>Confirmed</button>
          <button type="button" className="demo-button secondary" onClick={resetDemoProjects}>Reset</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel panel-wide">
          <div className="panel-header space-between">
            <h3>Project List</h3>
          </div>
          <ProjectTable projects={projects} onSelect={setSelectedProjectId} />
        </div>

        <div className="panel panel-detail">
          <div className="panel-header space-between">
            <h3>Project Details</h3>
            <div className="detail-actions">
              <button type="button" className="icon-button-inline" onClick={() => setTimelineOpen(true)} title="Open timeline">
                ⏱
              </button>
              <StatusBadge project={selectedProject} />
            </div>
          </div>

          <div className="detail-card">
            <div className="section-block">
              <p className="eyebrow">Client Information</p>
              <div className="field-grid">
                <div><label>Client Name</label><p>{selectedProject.client.name}</p></div>
                <div><label>Email</label><p>{selectedProject.client.email}</p></div>
                <div><label>Phone</label><p>{selectedProject.client.phone}</p></div>
                <div><label>Event Type</label><p>{selectedProject.eventType}</p></div>
                <div><label>Event Date</label><p>{formatDate(selectedProject.eventDate)}</p></div>
                <div><label>Venue</label><p>{selectedProject.venue}</p></div>
                <div><label>Guests</label><p>{selectedProject.guestCount}</p></div>
                <div><label>Status</label><div className="status-inline"><StatusBadge project={selectedProject} /></div></div>
                <div className="full-width"><label>Requirements</label><p>{selectedProject.requirements}</p></div>
              </div>
            </div>

            {selectedProject.initialQuote ? (
              <div className="section-block">
                <p className="eyebrow">Quote Information</p>
                <div className="quote-box">
                  <div className="quote-row"><strong>Quoted Amount</strong> <span>{formatCurrency(selectedProject.initialQuote.amount)}</span></div>
                  <div className="quote-row"><strong>Advance Required</strong> <span>{selectedProject.initialQuote.advancePercent ?? selectedProject.payment?.advancePercent ?? 30}%</span></div>
                  <div className="quote-row"><strong>Advance Amount</strong> <span>{formatCurrency(selectedProject.payment?.amount ?? Math.round((selectedProject.initialQuote.amount * (selectedProject.initialQuote.advancePercent ?? selectedProject.payment?.advancePercent ?? 30)) / 100))}</span></div>
                  <div className="quote-row"><strong>Sent On</strong> <span>{formatDate(selectedProject.initialQuote.sentAt)}</span></div>
                  <div className="quote-comment">
                    <strong>Admin Comment</strong>
                    <p>{selectedProject.initialQuote.comment}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="section-block">
                <p className="eyebrow">Send Quote</p>
                <div className="form-stack">
                  <div>
                    <label>Quote Amount</label>
                    <input type="number" min="1" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} placeholder="75000" />
                  </div>
                  <div>
                    <label>Advance Payment (%)</label>
                    <input type="number" min="0" max="100" value={quoteAdvancePercent} onChange={(event) => setQuoteAdvancePercent(event.target.value)} placeholder="30" />
                  </div>
                  <div>
                    <label>Comment</label>
                    <textarea rows={4} value={quoteComment} onChange={(event) => setQuoteComment(event.target.value)} placeholder="Wedding photography + cinematic videography package." />
                  </div>
                  {quoteError ? <div className="error-box">{quoteError}</div> : null}
                  {quoteSuccess ? <div className="success-box">{quoteSuccess}</div> : null}
                  <button type="button" className="primary-button" onClick={handleSendQuote}>Send Quote</button>
                </div>
              </div>
            )}

            {selectedProject.clientResponse?.type === "REJECTED" && !selectedProject.negotiation ? (
              <div className="section-block">
                <p className="eyebrow">Client Rejected</p>
                <div className="warning-box">
                  <strong>Client Comment:</strong>
                  <p>{selectedProject.clientResponse.comment || "No reason provided."}</p>
                </div>
                <div className="form-stack">
                  <div>
                    <label>Negotiation Amount</label>
                    <input type="number" min="1" value={negotiationAmount} onChange={(event) => setNegotiationAmount(event.target.value)} placeholder="65000" />
                  </div>
                  <div>
                    <label>Advance Payment (%)</label>
                    <input type="number" min="0" max="100" value={negotiationAdvancePercent} onChange={(event) => setNegotiationAdvancePercent(event.target.value)} placeholder="30" />
                  </div>
                  <div>
                    <label>Admin Comment</label>
                    <textarea rows={4} value={negotiationComment} onChange={(event) => setNegotiationComment(event.target.value)} placeholder="We can offer a discounted package at ₹65,000." />
                  </div>
                  {negotiationError ? <div className="error-box">{negotiationError}</div> : null}
                  {negotiationSuccess ? <div className="success-box">{negotiationSuccess}</div> : null}
                  <button type="button" className="primary-button" onClick={handleSendNegotiation}>Send Negotiation</button>
                </div>
              </div>
            ) : null}

            {selectedProject.negotiation ? (
              <div className="section-block">
                <p className="eyebrow">Negotiation</p>
                <div className="quote-box">
                  <div className="quote-row"><strong>Negotiated Amount</strong> <span>{formatCurrency(selectedProject.negotiation.amount)}</span></div>
                  <div className="quote-row"><strong>Advance Required</strong> <span>{selectedProject.negotiation.advancePercent ?? selectedProject.payment?.advancePercent ?? 30}%</span></div>
                  <div className="quote-row"><strong>Advance Amount</strong> <span>{formatCurrency(selectedProject.payment?.amount ?? Math.round((selectedProject.negotiation.amount * (selectedProject.negotiation.advancePercent ?? selectedProject.payment?.advancePercent ?? 30)) / 100))}</span></div>
                  <div className="quote-row"><strong>Sent On</strong> <span>{formatDate(selectedProject.negotiation.sentAt)}</span></div>
                  <div className="quote-comment">
                    <strong>Admin Comment</strong>
                    <p>{selectedProject.negotiation.comment}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedProject.clientResponse?.type === "ACCEPTED" || selectedProject.negotiationResponse?.type === "ACCEPTED" ? (
              <div className="section-block">
                <p className="eyebrow">Team Assignment</p>
                {selectedProject.teamAssignment ? (
                  <div className="quote-box">
                    <div className="quote-row"><strong>Assigned Member</strong> <span>{selectedProject.teamAssignment.member}</span></div>
                    <div className="quote-row"><strong>Shot Date</strong> <span>{formatDate(selectedProject.teamAssignment.date)}</span></div>
                    <div className="quote-row"><strong>Camera</strong> <span>{selectedProject.teamAssignment.camera}</span></div>
                    <div className="quote-row"><strong>Gear</strong> <span>{selectedProject.teamAssignment.gear}</span></div>
                    <div className="quote-comment">
                      <strong>Notes</strong>
                      <p>{selectedProject.teamAssignment.notes || "No extra notes added."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="form-stack">
                    <div>
                      <label>Team Member</label>
                      <input value={assignmentForm.member} onChange={(event) => setAssignmentForm((current) => ({ ...current, member: event.target.value }))} placeholder="Aman Roy" />
                    </div>
                    <div>
                      <label>Shoot Date</label>
                      <input type="date" value={assignmentForm.date} onChange={(event) => setAssignmentForm((current) => ({ ...current, date: event.target.value }))} />
                    </div>
                    <div>
                      <label>Camera</label>
                      <input value={assignmentForm.camera} onChange={(event) => setAssignmentForm((current) => ({ ...current, camera: event.target.value }))} placeholder="Sony A7 IV + 24-70mm" />
                    </div>
                    <div>
                      <label>Gear / Crew</label>
                      <input value={assignmentForm.gear} onChange={(event) => setAssignmentForm((current) => ({ ...current, gear: event.target.value }))} placeholder="2 shooters, drone, lighting kit" />
                    </div>
                    <div>
                      <label>Notes</label>
                      <textarea rows={4} value={assignmentForm.notes} onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Arrival time, location briefing, and deliverables." />
                    </div>
                    {assignmentError ? <div className="error-box">{assignmentError}</div> : null}
                    {assignmentSuccess ? <div className="success-box">{assignmentSuccess}</div> : null}
                    <button type="button" className="primary-button" onClick={handleAssignTeam}>Assign Team</button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

      </div>

      </div>}
      </main>
      <Modal title="Project Timeline" open={isTimelineOpen} onClose={() => setTimelineOpen(false)}>
        <ProjectTimeline project={selectedProject} />
      </Modal>
    </div>
  );
}
