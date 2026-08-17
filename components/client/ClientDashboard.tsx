"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/common/Modal";
import { ProjectTable } from "@/components/common/ProjectTable";
import { ProjectTimeline } from "@/components/common/ProjectTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ClientRequestForm } from "@/components/client/ClientRequestForm";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { formatCurrency, formatDate } from "@/utils/status";

export function ClientDashboard() {
  const { projects, selectedProjectId, setSelectedProjectId, acceptQuote, rejectQuote, acceptNegotiation, rejectNegotiation } = useProjectContext();
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [isRequestFormModalOpen, setRequestFormModalOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [negotiationRejectText, setNegotiationRejectText] = useState("");
  const [isNegotiationRejectModalOpen, setNegotiationRejectModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isTimelineOpen, setTimelineOpen] = useState(false);

  const clientProjects = useMemo(() => projects.filter((project) => project.client.email.includes("@") && project.client.phone), [projects]);

  const selectedProject = useMemo(
    () => clientProjects.find((project) => project.id === selectedProjectId) ?? clientProjects[0] ?? projects[0],
    [clientProjects, projects, selectedProjectId],
  );

  if (!selectedProject) {
    return <div className="empty-state">No projects available.</div>;
  }

  const currentQuote = selectedProject.negotiation ?? selectedProject.initialQuote;

  const handleAcceptQuote = () => {
    acceptQuote(selectedProject.id);
    setFeedback("Quotation accepted successfully.");
    setConfirmModalOpen(false);
  };

  const handleRejectQuote = () => {
    if (!rejectText.trim()) {
      setError("Reason/comment is required.");
      return;
    }

    rejectQuote(selectedProject.id, rejectText.trim());
    setFeedback("Quotation rejected successfully.");
    setRejectText("");
    setRejectModalOpen(false);
    setError("");
  };

  const handleAcceptNegotiation = () => {
    acceptNegotiation(selectedProject.id);
    setFeedback("Negotiation accepted successfully.");
  };

  const handleRejectNegotiation = () => {
    if (!negotiationRejectText.trim()) {
      setError("Reason/comment is required.");
      return;
    }

    rejectNegotiation(selectedProject.id, negotiationRejectText.trim());
    setFeedback("Negotiation rejected successfully.");
    setNegotiationRejectText("");
    setNegotiationRejectModalOpen(false);
    setError("");
  };

  return (
    <div className="dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Client Portal</p>
          <h2>My Projects</h2>
        </div>
        <div className="header-actions">
          <button type="button" className="primary-button" onClick={() => setRequestFormModalOpen(true)}>
            + New Request
          </button>
        </div>
      </section>

      <div className="dashboard-grid client-grid">
        <div className="panel panel-wide">
          <div className="panel-header space-between">
            <h3>My Requests</h3>
          </div>
          <ProjectTable projects={clientProjects} onSelect={setSelectedProjectId} />
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
              <p className="eyebrow">Event Information</p>
              <div className="field-grid">
                <div><label>Event Type</label><p>{selectedProject.eventType}</p></div>
                <div><label>Event Date</label><p>{formatDate(selectedProject.eventDate)}</p></div>
                <div><label>Venue</label><p>{selectedProject.venue}</p></div>
                <div><label>Guest Count</label><p>{selectedProject.guestCount}</p></div>
                <div><label>Status</label><div className="status-inline"><StatusBadge project={selectedProject} /></div></div>
                <div className="full-width"><label>Requirements</label><p>{selectedProject.requirements}</p></div>
              </div>
            </div>

            {currentQuote ? (
              <div className="section-block">
                <p className="eyebrow">Current Quote</p>
                <div className="quote-box">
                  <div className="quote-row"><strong>Photography Package</strong></div>
                  <div className="quote-row"><strong>Quoted Amount</strong> <span>{formatCurrency(currentQuote.amount)}</span></div>
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
                    <button type="button" className="success-button" onClick={handleAcceptNegotiation}>
                      Accept Negotiation
                    </button>
                    <button type="button" className="danger-button" onClick={() => setNegotiationRejectModalOpen(true)}>
                      Reject Negotiation
                    </button>
                  </div>
                )}

                {!selectedProject.negotiation && !selectedProject.clientResponse && (
                  <div className="cta-row">
                    <button type="button" className="success-button" onClick={() => setConfirmModalOpen(true)}>
                      Accept Quote
                    </button>
                    <button type="button" className="danger-button" onClick={() => setRejectModalOpen(true)}>
                      Reject Quote
                    </button>
                  </div>
                )}

                {!selectedProject.negotiation && selectedProject.clientResponse?.type === "ACCEPTED" ? (
                  <div className="success-box">Quote Accepted. Your photography project has been confirmed.</div>
                ) : null}

                {!selectedProject.negotiation && selectedProject.clientResponse?.type === "REJECTED" ? (
                  <div className="warning-box">Client rejected the quotation. Awaiting negotiation.</div>
                ) : null}

                {selectedProject.negotiation && selectedProject.negotiationResponse?.type === "ACCEPTED" ? (
                  <div className="success-box">Negotiation Accepted. Project confirmed.</div>
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

      </div>

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
            <button type="button" className="success-button" onClick={handleAcceptQuote}>
              Confirm
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
            <button type="button" className="danger-button" onClick={handleRejectQuote}>
              Reject Quote
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
        title="Reject Negotiation"
        open={isNegotiationRejectModalOpen}
        onClose={() => setNegotiationRejectModalOpen(false)}
        actions={
          <>
            <button type="button" className="secondary-button" onClick={() => setNegotiationRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="danger-button" onClick={handleRejectNegotiation}>
              Reject Negotiation
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
