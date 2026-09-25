"use client";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { useState } from "react";
import { formatDate, getProjectStatus } from "@/utils/status";

export function TeamDashboard() {
  const { projects, currentUser, requestTeamInterest, markLeaderArrived, toggleEventTrackerMember, toggleEventTrackerTask, updateEventDelay, sendEventTrackerMessage, logout } = useProjectContext();
  const [delayNotes, setDelayNotes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const confirmedProjects = projects.filter((project) => getProjectStatus(project) === "PROJECT_CONFIRMED");

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Team Portal</p>
          <h2>Available Events</h2>
        </div>
        <div className="header-actions"><span className="pill">{confirmedProjects.length} confirmed events</span><button type="button" className="secondary-button" onClick={logout}>Log out</button></div>
      </section>

      <div className="panel">
        {confirmedProjects.length === 0 ? (
          <div className="empty-state">No client-confirmed events are available yet.</div>
        ) : (
          <div className="team-event-list">
            {confirmedProjects.map((project) => {
              const interest = project.teamInterest?.find((item) => item.memberEmail === currentUser?.email);
              const isApprovedForMember = interest?.status === "ACCEPTED";
              const hasPendingInterest = interest?.status === "PENDING";
              const hasRejectedInterest = interest?.status === "REJECTED";
              const assignedMember = project.eventTeam?.find((member) => member.memberEmail === currentUser?.email);
              const teamLeader = project.eventTeam?.find((member) => (member.userType ?? (member.role === "Team Leader" ? "Team Leader" : "Member")) === "Team Leader");
              const eventStart = new Date(`${project.eventDate}T00:00:00`).getTime();
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const daysUntilEvent = Math.ceil((eventStart - todayStart.getTime()) / (1000 * 60 * 60 * 24));
              const detailsUnlocked = daysUntilEvent >= 0 && daysUntilEvent <= 7;
              const userType = assignedMember?.userType ?? (assignedMember?.role === "Team Leader" ? "Team Leader" : "Member");
              const isTeamLeader = userType === "Team Leader";
              const isEventDay = new Date().toISOString().slice(0, 10) === project.eventDate;
              const tracker = project.eventTracker ?? { memberJoinedAt: {}, tasks: [], messages: [] };

              return (
                <article className="team-event" key={project.id}>
                  <div className="team-event-header">
                    <div>
                      <p className="eyebrow">{project.id}</p>
                      <h3>{project.client.name}</h3>
                    </div>
                    <span className="pill">{isApprovedForMember ? "Approved" : hasPendingInterest ? "Pending" : hasRejectedInterest ? "Rejected" : "Available"}</span>
                  </div>

                  <div className="team-event-details">
                    <div><span>Event</span><strong>{project.eventType}</strong></div>
                    <div><span>Date</span><strong>{formatDate(project.eventDate)}</strong></div>
                    {assignedMember ? <div><span>User Type</span><strong>{userType}</strong></div> : null}
                    {isTeamLeader && detailsUnlocked ? <><div><span>Address</span><strong>{project.venue}</strong></div><div><span>Guests</span><strong>{project.guestCount}</strong></div></> : null}
                  </div>

                  {isApprovedForMember ? (
                    assignedMember ? detailsUnlocked ? <div className="team-event-full-details">
                      <div><span>User Type</span><strong>{userType}</strong></div>
                      {project.teamBrief ? <><div><span>Call Time</span><strong>{new Date(project.teamBrief.callTime).toLocaleString()}</strong></div><div><span>Call Venue</span><strong>{project.teamBrief.callVenue}</strong></div></> : null}
                      {isTeamLeader ? <div><span>Client Phone</span><strong>{project.client.phone}</strong></div> : null}
                      {isTeamLeader ? <>
                        <div><span>Client Name</span><strong>{project.client.name}</strong></div>
                        <div><span>Address</span><strong>{project.venue}</strong></div>
                        {project.eventTeam?.length ? <div className="team-event-assignment"><span>Team Members</span><strong>{project.eventTeam.filter((member) => member.memberEmail !== currentUser?.email).map((member) => `${member.member} · ${member.memberPhone || "Phone not provided"} · ${member.role}`).join(", ") || "No other members assigned."}</strong></div> : null}
                      </> : <><div><span>Team Leader Name</span><strong>{teamLeader?.member || "Not assigned"}</strong></div><div><span>Team Leader Phone</span><strong>{teamLeader?.memberPhone || "Not provided"}</strong></div></>}
                    </div> : <div className="team-event-action"><p>Contact details will be visible 7 days before the event.</p></div> : <div className="team-event-action"><p>Admin approved your interest. Waiting for event team assignment.</p></div>
                  ) : (
                    <div className="team-event-action">
                      <p>{hasPendingInterest ? "Your interest is waiting for admin approval." : hasRejectedInterest ? "Admin rejected this request." : "Request access to see the full event brief."}</p>
                      {!hasPendingInterest && !hasRejectedInterest ? (
                        <button type="button" className="primary-button" onClick={() => {
                          const message = requestTeamInterest(project.id);
                          if (message) window.alert(message);
                        }}>
                          I&apos;m Interested
                        </button>
                      ) : null}
                    </div>
                  )}
                  {assignedMember && isEventDay ? <div className="event-day-tracker">
                    <p className="eyebrow">Event Day Tracker</p>
                    {isTeamLeader ? <><button type="button" className="primary-button" onClick={() => markLeaderArrived(project.id)}>{tracker.leaderArrivedAt ? `Reached at ${new Date(tracker.leaderArrivedAt).toLocaleTimeString()}` : "I have reached the event"}</button><div className="tracker-members"><strong>Member attendance</strong>{project.eventTeam?.filter((member) => member.memberEmail !== currentUser?.email).map((member) => <label className="check-item" key={member.memberEmail}><input type="checkbox" checked={Boolean(tracker.memberJoinedAt[member.memberEmail])} onChange={() => toggleEventTrackerMember(project.id, member.memberEmail)} />{member.member} ({member.memberPhone || "No phone"}){tracker.memberJoinedAt[member.memberEmail] ? ` · Checked in at ${new Date(tracker.memberJoinedAt[member.memberEmail]).toLocaleTimeString()}` : " · Not checked in"}</label>)}</div><div className="tracker-tasks"><strong>Event checklist</strong>{tracker.tasks.map((task) => <label className="check-item" key={task.id}><input type="checkbox" checked={task.completed} onChange={() => toggleEventTrackerTask(project.id, task.id)} />{task.label}{task.completedAt ? ` · ${new Date(task.completedAt).toLocaleTimeString()}` : ""}</label>)}</div><textarea placeholder="Report a delay or issue" value={delayNotes[project.id] ?? tracker.delayNote ?? ""} onChange={(event) => setDelayNotes((current) => ({ ...current, [project.id]: event.target.value }))} /><button type="button" className="secondary-button" onClick={() => updateEventDelay(project.id, delayNotes[project.id] ?? "")}>Save Delay Note</button></> : <div className="tracker-members"><strong>My attendance</strong><label className="check-item"><input type="checkbox" checked={Boolean(tracker.memberJoinedAt[assignedMember?.memberEmail ?? currentUser?.email ?? ""])} onChange={() => toggleEventTrackerMember(project.id, assignedMember?.memberEmail ?? currentUser?.email ?? "")} />I have joined{tracker.memberJoinedAt[assignedMember?.memberEmail ?? currentUser?.email ?? ""] ? ` · Checked in at ${new Date(tracker.memberJoinedAt[assignedMember?.memberEmail ?? currentUser?.email ?? ""]).toLocaleTimeString()}` : ""}</label></div>}
                    <div className="tracker-chat"><strong>Admin chat</strong>{tracker.messages.map((message) => <p key={message.id}><b>{message.sender}</b> · {message.message}</p>)}<input placeholder="Message admin" value={messages[project.id] ?? ""} onChange={(event) => setMessages((current) => ({ ...current, [project.id]: event.target.value }))} /><button type="button" className="secondary-button" onClick={() => { if (messages[project.id]?.trim()) { sendEventTrackerMessage(project.id, messages[project.id].trim(), "team-leader"); setMessages((current) => ({ ...current, [project.id]: "" })); } }}>Send Message</button></div>
                  </div> : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
