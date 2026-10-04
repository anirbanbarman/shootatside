import type { Project } from "@/types/project";

export function downloadProjectContract(project: Project) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
  const amount = project.negotiation?.amount ?? project.initialQuote?.amount ?? 0;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Photography Service Contract</title><style>body{font:16px Arial;max-width:760px;margin:40px auto;line-height:1.6;color:#1d2733}h1{border-bottom:2px solid #365c78;padding-bottom:12px}.signatures{display:flex;gap:40px;margin-top:60px}.signatures div{flex:1;border-top:1px solid #333;padding-top:8px}</style></head><body><h1>Photography Service Contract</h1><p><b>Client:</b> ${escapeHtml(project.client.name)}</p><p><b>Email / phone:</b> ${escapeHtml(project.client.email)} · ${escapeHtml(project.client.phone)}</p><p><b>Event:</b> ${escapeHtml(project.eventType)} · ${escapeHtml(project.eventDate)}</p><p><b>Venue:</b> ${escapeHtml(project.venue)}</p><p><b>Selected budget:</b> ${escapeHtml(project.budget ?? "Not specified")}</p><p><b>Agreed quote:</b> ₹${amount.toLocaleString("en-IN")}</p><p><b>Advance:</b> ${project.payment?.advancePercent ?? 30}% (₹${(project.payment?.amount ?? 0).toLocaleString("en-IN")})</p><p><b>Requirements:</b> ${escapeHtml(project.requirements)}</p><p>Both parties agree to the event details and quoted service above. The booking is confirmed after payment verification.</p><div class="signatures"><div>Client: ${escapeHtml(project.contract?.clientSignature ?? "")}<br>Signed: ${escapeHtml(project.contract?.clientSignedAt ?? "")}</div><div>Admin: ${escapeHtml(project.contract?.adminSignature ?? "")}<br>Signed: ${escapeHtml(project.contract?.adminSignedAt ?? "")}</div></div></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `contract-${project.eventDate}.html`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
