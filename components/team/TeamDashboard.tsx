"use client";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { formatDate, getProjectStatus } from "@/utils/status";

export function TeamDashboard() {
  const { projects, currentUser, requestTeamInterest } = useProjectContext();
  const confirmedProjects = projects.filter((project) => getProjectStatus(project) === "PROJECT_CONFIRMED");

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Team Portal</p>
          <h2>Available Events</h2>
        </div>
        <span className="pill">{confirmedProjects.length} confirmed events</span>
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
