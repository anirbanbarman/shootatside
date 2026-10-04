"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Modal } from "@/components/common/Modal";
import { ProjectTable } from "@/components/common/ProjectTable";
import { ProjectTimeline } from "@/components/common/ProjectTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ClientRequestForm } from "@/components/client/ClientRequestForm";
import { EditingChat } from "@/components/common/EditingChat";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { formatCurrency, formatDate } from "@/utils/status";
import { getEditingMilestones, getEditingProgress } from "@/utils/notifications";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

export function ClientDashboard() {
  const { projects, currentUser, selectedProjectId, setSelectedProjectId, acceptQuote, rejectQuote, acceptNegotiation, rejectNegotiation, payAdvance, updateClientTeamBrief, submitClientContactDetails } = useProjectContext();
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [isRequestFormModalOpen, setRequestFormModalOpen] = useState(false);
  const [isPayAdvanceModalOpen, setPayAdvanceModalOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [negotiationRejectText, setNegotiationRejectText] = useState("");
  const [isNegotiationRejectModalOpen, setNegotiationRejectModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isTimelineOpen, setTimelineOpen] = useState(false);
  const [isProjectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [teamBrief, setTeamBrief] = useState({ callTime: "", callVenue: "" });
  const [contactForm, setContactForm] = useState({ phone: "", email: "", preferredContact: "PHONE" as "PHONE" | "EMAIL" | "WHATSAPP", bestTimeToContact: "", message: "" });

  const clientProjects = useMemo(() => projects.filter((project) => {
    if (currentUser?.role !== "client") return false;
    return project.client.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
  }), [currentUser, projects]);

  const selectedProject = useMemo(
    () => clientProjects.find((project) => project.id === selectedProjectId) ?? clientProjects[0],
    [clientProjects, selectedProjectId],
  );

  if (!selectedProject) {
    return <div className="empty-state">No projects available.</div>;
  }

  const currentQuote = selectedProject.negotiation ?? selectedProject.initialQuote;
  const advancePercent = currentQuote?.advancePercent ?? selectedProject.payment?.advancePercent ?? 30;
  const advanceAmount = selectedProject.payment?.amount ?? Math.round(((currentQuote?.amount ?? 0) * advancePercent) / 100);
  const eventTeamLeader = selectedProject.eventTeam?.find((member) => (member.userType ?? (member.role === "Team Leader" ? "Team Leader" : "Member")) === "Team Leader");
  const eventDateStart = new Date(`${selectedProject.eventDate}T00:00:00`).getTime();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const teamDetailsUnlocked = Math.ceil((eventDateStart - todayStart.getTime()) / (1000 * 60 * 60 * 24)) >= 0 && Math.ceil((eventDateStart - todayStart.getTime()) / (1000 * 60 * 60 * 24)) <= 7;

  const handleTeamBriefSubmit = () => {
    if (!teamBrief.callTime.trim() || !teamBrief.callVenue.trim()) return;
    updateClientTeamBrief(selectedProject.id, teamBrief);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectDetailsOpen(true);
  };

  const handleContactFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const details = {
      ...contactForm,
      phone: contactForm.phone.trim() || selectedProject.client.phone,
      email: contactForm.email.trim() || selectedProject.client.email,
    };
    if (!details.phone.trim() || !details.email.trim() || !details.bestTimeToContact.trim()) return;
    setIsSubmittingContract(true);
    setError("");
    setFeedback("");
    try {
      await submitClientContactDetails(selectedProject.id, details);
      setFeedback("Contract details sent successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send contract details. Please try again.");
    } finally {
      setIsSubmittingContract(false);
    }
  };

  const handleAcceptQuote = async () => {
    setIsProcessingDecision(true);
    setError("");
    try {
      await acceptQuote(selectedProject.id);
      setFeedback("Quotation accepted successfully. Please complete the advance payment to confirm the booking.");
      setConfirmModalOpen(false);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to accept the quote. Please try again.");
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handlePayAdvance = async () => {
    if (!paymentScreenshot) {
      setPaymentError("Upload a payment screenshot before submitting.");
      return;
    }
    if (!paymentScreenshot.type.startsWith("image/")) {
      setPaymentError("Choose an image file for your payment screenshot.");
      return;
    }
    if (paymentScreenshot.size > 5 * 1024 * 1024) {
      setPaymentError("The screenshot must be smaller than 5 MB.");
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError("");
    try {
      const screenshotDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read the screenshot."));
        reader.onerror = () => reject(new Error("Unable to read the screenshot."));
        reader.readAsDataURL(paymentScreenshot);
      });
      await payAdvance(selectedProject.id, screenshotDataUrl, paymentScreenshot.name);
      setFeedback("Payment screenshot sent. The admin will review and confirm your payment.");
      setPaymentScreenshot(null);
      setPayAdvanceModalOpen(false);
    } catch (submitError) {
      setPaymentError(submitError instanceof Error ? submitError.message : "Unable to submit payment screenshot. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectText.trim()) {
      setError("Reason/comment is required.");
      return;
    }

    setIsProcessingDecision(true);
    setError("");
    try {
      await rejectQuote(selectedProject.id, rejectText.trim());
      setFeedback("Quotation rejected successfully.");
      setRejectText("");
      setRejectModalOpen(false);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to reject the quote. Please try again.");
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleAcceptNegotiation = async () => {
    setIsProcessingDecision(true);
    setError("");
    try {
      await acceptNegotiation(selectedProject.id);
      setFeedback("Negotiation accepted successfully.");
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to accept the negotiation. Please try again.");
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleRejectNegotiation = async () => {
    if (!negotiationRejectText.trim()) {
      setError("Reason/comment is required.");
      return;
    }

    setIsProcessingDecision(true);
    setError("");
    try {
      await rejectNegotiation(selectedProject.id, negotiationRejectText.trim());
      setFeedback("Negotiation rejected successfully.");
      setNegotiationRejectText("");
      setNegotiationRejectModalOpen(false);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to reject the negotiation. Please try again.");
    } finally {
      setIsProcessingDecision(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Client</p>
          <h2>My Projects</h2>
        </div>
        <div className="header-actions">
          <button type="button" className="primary-button" onClick={() => setRequestFormModalOpen(true)}>
            + New Request
          </button>
        </div>
      </section>

      <div className="client-project-list">
        <div className="panel panel-wide">
          <div className="panel-header space-between">
            <h3>My Requests</h3>
          </div>
          <ProjectTable projects={clientProjects} onSelect={handleProjectSelect} selectedProjectId={selectedProjectId} />
        </div>
      </div>

      <Modal title={`Project Details · ${selectedProject.client.name} · ${selectedProject.eventType}`} open={isProjectDetailsOpen} onClose={() => setProjectDetailsOpen(false)} className="project-details-modal">
        <div className="client-project-modal-content">
          {selectedProject.requestAcceptedAt ? <section className="section-block client-contact-request">
            <Typography variant="h6" component="h3">Contact Details</Typography>
            {selectedProject.clientContactDetails ? <Alert severity="success">Contract form sent. The studio will contact you using your preferred method.</Alert> : <>
              <Alert severity="info">Your request was accepted by the studio. Please confirm how and when they should contact you.</Alert>
              <Box component="form" onSubmit={handleContactFormSubmit}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField fullWidth required label="Phone number" type="tel" value={contactForm.phone || selectedProject.client.phone} onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))} />
                    <TextField fullWidth required label="Email address" type="email" value={contactForm.email || selectedProject.client.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} />
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl fullWidth><InputLabel id="contact-method-label">Preferred contact method</InputLabel><Select labelId="contact-method-label" label="Preferred contact method" value={contactForm.preferredContact} onChange={(event) => setContactForm((current) => ({ ...current, preferredContact: event.target.value as typeof current.preferredContact }))}><MenuItem value="PHONE">Phone</MenuItem><MenuItem value="EMAIL">Email</MenuItem><MenuItem value="WHATSAPP">WhatsApp</MenuItem></Select></FormControl>
                    <TextField fullWidth required label="Best time to contact" placeholder="e.g. 10:00 AM–1:00 PM" value={contactForm.bestTimeToContact} onChange={(event) => setContactForm((current) => ({ ...current, bestTimeToContact: event.target.value }))} />
                  </Stack>
                  <TextField fullWidth multiline minRows={3} label="Message for the studio (optional)" value={contactForm.message} onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))} />
                  <Box><Button type="submit" variant="contained" disabled={isSubmittingContract} startIcon={<SendOutlinedIcon />}>{isSubmittingContract ? "Sending…" : "Send Contract Details"}</Button></Box>
                </Stack>
              </Box>
            </>}
          </section> : null}
          <div className="panel-header space-between">
            <h3>Overview &amp; Status</h3>
            <div className="detail-actions">
              <button type="button" className="icon-button-inline" onClick={() => setTimelineOpen(true)} title="Open timeline">
                ⏱
              </button>
              <StatusBadge project={selectedProject} />
            </div>
          </div>

          <div className="detail-card">
            <div className="section-block">
              <p className="eyebrow">Event Information</p>
              <div className="field-grid">
                <div><label>Event Type</label><p>{selectedProject.eventType}</p></div>
                <div><label>Event Date</label><p>{formatDate(selectedProject.eventDate)}</p></div>
                <div><label>Venue</label><p>{selectedProject.venue}</p></div>
                <div><label>Status</label><div className="status-inline"><StatusBadge project={selectedProject} /></div></div>
                <div className="full-width"><label>Requirements</label><p>{selectedProject.requirements}</p></div>
              </div>
            </div>

            {selectedProject.eventTeam?.length ? <div className="section-block">
              <p className="eyebrow">Event Checklist &amp; Updates</p>
              {selectedProject.eventTracker?.tasks.length ? <div className="tracker-tasks">{selectedProject.eventTracker.tasks.map((task) => <div className={`check-item ${task.completed ? "tracker-task-complete" : ""}`} key={task.id}><span aria-hidden="true">{task.completed ? "✓" : "○"}</span><span>{task.label}</span><strong>{task.completed ? "Completed" : "Pending"}</strong>{task.completedAt ? <small>{new Date(task.completedAt).toLocaleString()}</small> : null}</div>)}</div> : <p className="form-note">The event checklist has not been added yet.</p>}
              {selectedProject.eventTracker?.delayNote ? <div className="warning-box"><strong>Reported delay / issue:</strong> {selectedProject.eventTracker.delayNote}</div> : <p className="form-note">No delay or issue has been reported.</p>}
            </div> : null}

            {selectedProject.eventTracker?.eventCompletedAt ? <div className="section-block client-editing-notification">
              <p className="eyebrow">Production Notifications</p>
              <div className="success-box">Event Completed · {new Date(selectedProject.eventTracker.eventCompletedAt).toLocaleString()}</div>
              {selectedProject.editingWorkflow ? <>
                {selectedProject.editingWorkflow.adminTimeline ? <div className="editor-timeline"><strong>Editing timeline</strong><p>{selectedProject.editingWorkflow.adminTimeline}</p>{selectedProject.editingWorkflow.timelineDueDate ? <span>Target delivery: {formatDate(selectedProject.editingWorkflow.timelineDueDate)}</span> : null}</div> : <p className="form-note">The editing timeline will appear here when the editor is assigned and admin instructions are ready.</p>}
                {selectedProject.editingWorkflow.assignedEditorEmail ? <div className="editor-progress-head"><strong>Editing progress</strong><b>{getEditingProgress(selectedProject.editingWorkflow)}%</b></div> : <p className="form-note">The studio is arranging an editor for your completed event.</p>}
                {selectedProject.editingWorkflow.assignedEditorEmail ? <><div className="editor-progress-track" role="progressbar" aria-label="Editing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={getEditingProgress(selectedProject.editingWorkflow)}><span style={{ width: `${getEditingProgress(selectedProject.editingWorkflow)}%` }} /></div><div className="editor-stage-list">{getEditingMilestones(selectedProject.editingWorkflow).map((milestone) => <div className={`editor-stage-row ${milestone.status === "COMPLETED" ? "editor-stage-done" : ""}`} key={milestone.id}><span className="editor-stage-status-icon" aria-hidden="true">{milestone.status === "COMPLETED" ? "✓" : "○"}</span><span>{milestone.label}</span><strong>{milestone.status === "COMPLETED" ? "Completed" : "Not completed"}</strong></div>)}</div></> : null}
                {selectedProject.editingWorkflow.deliveredAt && selectedProject.editingWorkflow.finalDriveUrl ? <div className="success-box">Your edited files are ready · <a href={selectedProject.editingWorkflow.finalDriveUrl} target="_blank" rel="noreferrer">Open delivery folder ↗</a></div> : null}
                <EditingChat projectId={selectedProject.id} />
              </> : <p className="form-note">Your event is complete. Post-production updates will appear here.</p>}
            </div> : null}

            {selectedProject.eventTeam?.length ? <div className="section-block">
              <p className="eyebrow">Team Call Details</p>
              <div className="form-stack">
                <div><label htmlFor="team-call-time">Call Time</label><input id="team-call-time" type="datetime-local" value={teamBrief.callTime || selectedProject.teamBrief?.callTime || ""} onChange={(event) => setTeamBrief((current) => ({ ...current, callTime: event.target.value }))} /></div>
                <div><label htmlFor="team-call-venue">Call Venue</label><input id="team-call-venue" value={teamBrief.callVenue || selectedProject.teamBrief?.callVenue || ""} onChange={(event) => setTeamBrief((current) => ({ ...current, callVenue: event.target.value }))} placeholder="Meeting point / venue" /></div>
                <button type="button" className="primary-button" onClick={handleTeamBriefSubmit}>Save Call Details</button>
              </div>
              {selectedProject.teamBrief ? <div className="quote-box"><div className="quote-row"><strong>Saved Call Time</strong><span>{new Date(selectedProject.teamBrief.callTime).toLocaleString()}</span></div><div className="quote-row"><strong>Saved Call Venue</strong><span>{selectedProject.teamBrief.callVenue}</span></div></div> : null}
              {teamDetailsUnlocked && eventTeamLeader ? <div className="success-box">Team Leader: {eventTeamLeader.member} · {eventTeamLeader.memberPhone || "Phone not provided"}</div> : <p className="form-note">Team Leader contact details will be visible 7 days before the event.</p>}
            </div> : null}

            {currentQuote ? (
              <div className="section-block">
                <p className="eyebrow">Current Quote</p>
                <div className="quote-box">
                  <div className="quote-row"><strong>Photography Package</strong></div>
                  <div className="quote-row"><strong>Quoted Amount</strong> <span>{formatCurrency(currentQuote.amount)}</span></div>
                  <div className="quote-row"><strong>Advance Required</strong> <span>{advancePercent}%</span></div>
                  <div className="quote-row"><strong>Advance Amount</strong> <span>{formatCurrency(advanceAmount)}</span></div>
                  {currentQuote.comment ? (
                    <div className="quote-comment">
                      <strong>Admin Comment</strong>
                      <p>{currentQuote.comment}</p>
                    </div>
                  ) : null}
                  <div className="quote-row"><strong>Sent On</strong> <span>{formatDate(currentQuote.sentAt)}</span></div>
                </div>

                {selectedProject.negotiation && !selectedProject.negotiationResponse && (
                  <div className="cta-row">
                    <button type="button" className="success-button" disabled={isProcessingDecision} onClick={handleAcceptNegotiation}>
                      Accept Negotiation
                    </button>
                    <button type="button" className="danger-button" onClick={() => setNegotiationRejectModalOpen(true)}>
                      Reject Negotiation
                    </button>
                  </div>
                )}

                {!selectedProject.negotiation && !selectedProject.clientResponse && (
                  <div className="cta-row">
                    <button type="button" className="success-button" disabled={isProcessingDecision} onClick={() => setConfirmModalOpen(true)}>
                      Accept Quote
                    </button>
                    <button type="button" className="danger-button" disabled={isProcessingDecision} onClick={() => setRejectModalOpen(true)}>
                      Reject Quote
                    </button>
                  </div>
                )}

                {!selectedProject.negotiation && selectedProject.clientResponse?.type === "ACCEPTED" && (selectedProject.payment?.status ?? "PENDING") === "PENDING" ? (
                  <div className="cta-row">
                    <button type="button" className="success-button" onClick={() => setPayAdvanceModalOpen(true)}>
                      Pay Advance {formatCurrency(advanceAmount)}
                    </button>
                  </div>
                ) : null}

                {!selectedProject.negotiation && selectedProject.clientResponse?.type === "ACCEPTED" && selectedProject.payment?.status === "PAID" ? (
                  <div className="success-box">Advance payment received. Your booking is now confirmed.</div>
                ) : null}

                {!selectedProject.negotiation && selectedProject.clientResponse?.type === "REJECTED" ? (
                  <div className="warning-box">Client rejected the quotation. Awaiting negotiation.</div>
                ) : null}

                {selectedProject.negotiation && selectedProject.negotiationResponse?.type === "ACCEPTED" && (selectedProject.payment?.status ?? "PENDING") === "PENDING" ? (
                  <div className="cta-row">
                    <button type="button" className="success-button" onClick={() => setPayAdvanceModalOpen(true)}>
                      Pay Advance {formatCurrency(advanceAmount)}
                    </button>
                  </div>
                ) : null}

                {selectedProject.negotiation && selectedProject.negotiationResponse?.type === "ACCEPTED" && selectedProject.payment?.status === "PAID" ? (
                  <div className="success-box">Advance payment received. Negotiation accepted and booking confirmed.</div>
                ) : null}

                {selectedProject.payment?.status === "PROOF_SUBMITTED" ? (
                  <Alert severity="info">Payment screenshot submitted. Your booking will be confirmed after admin verification.</Alert>
                ) : null}

                {selectedProject.negotiation && selectedProject.negotiationResponse?.type === "REJECTED" ? (
                  <div className="warning-box">Negotiation rejected. Please provide updated feedback.</div>
                ) : null}

                {selectedProject.clientResponse?.type === "REJECTED" && !selectedProject.negotiation ? (
                  <div className="warning-box">Waiting for the admin to send a revised negotiation.</div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state small">No quote has been sent yet.</div>
            )}

            {feedback ? <div className="success-box">{feedback}</div> : null}
            {error ? <div className="error-box">{error}</div> : null}
          </div>
        </div>
      </Modal>

      <div className="form-panel-spacer" />

      <Modal
        title="Confirm Quote Acceptance"
        open={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        actions={
          <>
            <button type="button" className="secondary-button" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="success-button" disabled={isProcessingDecision} onClick={handleAcceptQuote}>
              {isProcessingDecision ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        <p>Are you sure you want to accept this quotation?</p>
      </Modal>

      <Modal
        title="Reject Quotation"
        open={isRejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        actions={
          <>
            <button type="button" className="secondary-button" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="danger-button" disabled={isProcessingDecision} onClick={handleRejectQuote}>
              {isProcessingDecision ? "Saving…" : "Reject Quote"}
            </button>
          </>
        }
      >
        <div className="form-stack">
          <p>Reason / Comment</p>
          <textarea
            rows={4}
            value={rejectText}
            onChange={(event) => setRejectText(event.target.value)}
            placeholder="Please share why this quote does not work for your budget or requirements."
          />
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        title="Pay Advance"
        open={isPayAdvanceModalOpen}
        onClose={() => { if (!isSubmittingPayment) setPayAdvanceModalOpen(false); }}
        className="pay-advance-modal"
        actions={
          <>
            <button type="button" className="secondary-button pay-advance-cancel" disabled={isSubmittingPayment} onClick={() => setPayAdvanceModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="success-button" disabled={isSubmittingPayment} onClick={handlePayAdvance}>
              {isSubmittingPayment ? "Submitting…" : `Pay ${formatCurrency(advanceAmount)}`}
            </button>
          </>
        }
      >
        <div className="form-stack">
          <p>After paying the advance, upload your payment screenshot for admin verification.</p>
          <p><strong>Amount to pay:</strong> {formatCurrency(advanceAmount)}</p>
          <div className="form-group">
            <label htmlFor="payment-screenshot">Payment screenshot</label>
            <input id="payment-screenshot" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setPaymentScreenshot(event.target.files?.[0] ?? null); setPaymentError(""); }} />
            {paymentScreenshot ? <small>{paymentScreenshot.name}</small> : null}
          </div>
          {paymentError ? <div className="error-box">{paymentError}</div> : null}
        </div>
      </Modal>

      <Modal
        title="Reject Negotiation"
        open={isNegotiationRejectModalOpen}
        onClose={() => setNegotiationRejectModalOpen(false)}
        actions={
          <>
            <button type="button" className="secondary-button" onClick={() => setNegotiationRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="danger-button" disabled={isProcessingDecision} onClick={handleRejectNegotiation}>
              {isProcessingDecision ? "Saving…" : "Reject Negotiation"}
            </button>
          </>
        }
      >
        <div className="form-stack">
          <p>Reason</p>
          <textarea
            rows={4}
            value={negotiationRejectText}
            onChange={(event) => setNegotiationRejectText(event.target.value)}
            placeholder="Unfortunately, this is still above our budget."
          />
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        title="Create New Photography Request"
        open={isRequestFormModalOpen}
        onClose={() => setRequestFormModalOpen(false)}
      >
        <ClientRequestForm onSuccess={() => setRequestFormModalOpen(false)} />
      </Modal>

     <Modal title="Project Timeline" open={isTimelineOpen} onClose={() => setTimelineOpen(false)}>
       <ProjectTimeline project={selectedProject} />
     </Modal>
   </div>
 );
}
