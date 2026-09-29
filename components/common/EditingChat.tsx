"use client";

import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { SectionCard } from "@/components/common/ui";
import { Chip } from "@mui/material";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EditingChat({ projectId }: { projectId: string }) {
  const { projects, currentUser, sendEditingChatMessage } = useProjectContext();
  const [draft, setDraft] = useState("");
  const project = projects.find((item) => item.id === projectId);
  const workflow = project?.editingWorkflow;
  const canView = Boolean(currentUser && workflow?.assignedEditorEmail && (
    currentUser.role === "admin"
    || (currentUser.role === "client" && currentUser.email.toLowerCase() === project?.client.email.toLowerCase())
    || (currentUser.role === "editor" && currentUser.email.toLowerCase() === workflow.assignedEditorEmail.toLowerCase())
  ));

  if (!canView || !workflow) return null;

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendEditingChatMessage(projectId, text);
    setDraft("");
  };

  return <SectionCard className="editing-chat" aria-label="Editing project chat" title="Project Chat" action={<Chip size="small" label={`${workflow.chatMessages?.length ?? 0} messages`} />}>
    <p className="editing-chat-description">Messages are shared with the client, admin, and assigned editor.</p>
    <div className="editing-chat-messages" aria-live="polite">
      {workflow.chatMessages?.length ? workflow.chatMessages.map((message) => <article className={`editing-chat-message editing-chat-message-${message.senderRole}`} key={message.id}>
        <div><strong>{message.senderName}</strong><span>{message.senderRole}</span><time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time></div>
        <p>{message.message}</p>
      </article>) : <p className="form-note">No messages yet. Start the project conversation.</p>}
    </div>
    <form className="editing-chat-form" onSubmit={sendMessage}>
      <label className="sr-only" htmlFor={`editing-chat-${projectId}`}>Message to the editing team</label>
      <input id={`editing-chat-${projectId}`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message to the project team…" maxLength={2000} />
      <button type="submit" className="primary-button" disabled={!draft.trim()}>Send</button>
    </form>
  </SectionCard>;
}
