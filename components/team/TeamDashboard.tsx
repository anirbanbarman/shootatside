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
                    <div><span>Venue</span><strong>{project.venue}</strong></div>
                    <div><span>Guests</span><strong>{project.guestCount}</strong></div>
                  </div>

                  {isApprovedForMember ? (
                    <div className="team-event-full-details">
                      <div><span>Client Email</span><strong>{project.client.email}</strong></div>
                      <div><span>Client Phone</span><strong>{project.client.phone}</strong></div>
                      <div className="team-event-requirements"><span>Requirements</span><strong>{project.requirements}</strong></div>
                      {project.teamAssignment ? (
                        <div className="team-event-assignment"><span>Team Brief</span><strong>{project.teamAssignment.notes || "See the event brief and arrive prepared."}</strong></div>
                      ) : null}
                      {project.eventTeam?.length ? <div className="team-event-assignment"><span>Event Team</span><strong>{project.eventTeam.map((member) => `${member.member} (${member.role})`).join(", ")}</strong></div> : null}
                    </div>
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
