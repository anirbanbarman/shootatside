"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/common/Modal";
import { ProjectTable } from "@/components/common/ProjectTable";
import { ProjectTimeline } from "@/components/common/ProjectTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { formatCurrency, formatDate } from "@/utils/status";

export function AdminDashboard() {
  const { projects, selectedProjectId, setSelectedProjectId, sendQuote, sendNegotiation, assignTeam, resetDemoProjects, seedDemoProject } = useProjectContext();
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteComment, setQuoteComment] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState("");
  const [negotiationAmount, setNegotiationAmount] = useState("");
  const [negotiationComment, setNegotiationComment] = useState("");
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

    if (!quoteAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setQuoteError("Quote amount is required and must be greater than 0.");
      setQuoteSuccess("");
      return;
    }

    if (!quoteComment.trim()) {
      setQuoteError("Please add a quote comment before sending.");
      setQuoteSuccess("");
      return;
    }

    sendQuote(selectedProject.id, amount, quoteComment.trim());
    setQuoteError("");
    setQuoteSuccess("Quote sent successfully.");
    setQuoteAmount("");
    setQuoteComment("");
  };

  const handleSendNegotiation = () => {
    const amount = Number(negotiationAmount);

    if (!negotiationAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setNegotiationError("Negotiation amount is required and must be greater than 0.");
      setNegotiationSuccess("");
      return;
    }

    if (!negotiationComment.trim()) {
      setNegotiationError("Please add a negotiation comment before sending.");
      setNegotiationSuccess("");
      return;
    }

    sendNegotiation(selectedProject.id, amount, negotiationComment.trim());
    setNegotiationError("");
    setNegotiationSuccess("Negotiation sent successfully.");
    setNegotiationAmount("");
    setNegotiationComment("");
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
    <div className="dashboard-shell">
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

      <Modal title="Project Timeline" open={isTimelineOpen} onClose={() => setTimelineOpen(false)}>
        <ProjectTimeline project={selectedProject} />
      </Modal>
    </div>
  );
}
