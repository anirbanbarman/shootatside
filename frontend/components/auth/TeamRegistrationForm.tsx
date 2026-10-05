"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TEAM_MEMBER_ROLES, type TeamMemberRole } from "@/types/project";

export function TeamRegistrationForm() {
  const { registerTeam } = useProjectContext();
  const [form, setForm] = useState({ name: "", mobile: "", whatsapp: "", email: "", address: "", phonePe: "" });
  const [preferredRoles, setPreferredRoles] = useState<TeamMemberRole[]>([]);
  const [aadharFile, setAadharFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [selfieFile, setSelfieFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readingUploads, setReadingUploads] = useState({ aadhar: false, selfie: false });

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateFile = (kind: "aadhar" | "selfie", setter: (value: { name: string; dataUrl: string } | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setter(null);
      return;
    }
    const allowedTypes = kind === "aadhar" ? ["image/png", "image/jpeg", "image/webp", "application/pdf"] : ["image/png", "image/jpeg", "image/webp"];
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedExtensions = kind === "aadhar" ? ["png", "jpg", "jpeg", "webp", "pdf"] : ["png", "jpg", "jpeg", "webp"];
    if ((file.type && !allowedTypes.includes(file.type)) || !allowedExtensions.includes(extension)) {
      setError(kind === "aadhar" ? "ID must be a PNG, JPEG, WebP, or PDF file." : "Selfie must be a PNG, JPEG, or WebP image.");
      event.target.value = "";
      setter(null);
      return;
    }
    if (file.size === 0) {
      setError("The selected file is empty. Choose another file.");
      event.target.value = "";
      setter(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Each upload must be 2 MB or smaller.");
      event.target.value = "";
      setter(null);
      return;
    }

    setReadingUploads((current) => ({ ...current, [kind]: true }));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter({ name: file.name, dataUrl: reader.result });
        setError("");
      } else {
        event.target.value = "";
        setter(null);
        setError("Unable to read the selected file. Please try again.");
      }
      setReadingUploads((current) => ({ ...current, [kind]: false }));
    };
    reader.onerror = () => {
      event.target.value = "";
      setter(null);
      setError("Unable to read the selected file. Please try again.");
      setReadingUploads((current) => ({ ...current, [kind]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || readingUploads.aadhar || readingUploads.selfie) return;
    if (Object.values(form).some((value) => !value.trim()) || !aadharFile || !selfieFile || preferredRoles.length === 0) {
      setError("Please complete every field, select both files, and choose at least one team role.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await registerTeam({
        ...form,
        aadharFileName: aadharFile.name,
        aadharDataUrl: aadharFile.dataUrl,
        selfieFileName: selfieFile.name,
        selfieDataUrl: selfieFile.dataUrl,
        preferredRoles,
      });
      setError("");
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return <div className="success-box" role="status">Registration received.</div>;
  }

  return (
    <form className="team-registration-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="team-form-grid">
        <div className="form-group"><label htmlFor="registration-name">Full Name</label><input id="registration-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-mobile">Mobile Number</label><input id="registration-mobile" type="tel" required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-whatsapp">WhatsApp Number</label><input id="registration-whatsapp" type="tel" required value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-email">Email ID</label><input id="registration-email" type="email" required value={form.email} onChange={(event) => updateField("email", event.target.value)} /></div>
        <div className="form-group full"><label htmlFor="registration-address">Address</label><textarea id="registration-address" required value={form.address} onChange={(event) => updateField("address", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-aadhar">Aadhar Card Upload</label><Box className="team-registration-upload"><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} fullWidth disabled={isSubmitting || readingUploads.aadhar}>{aadharFile ? "ID document selected" : "Upload ID image or PDF"}<input className="team-registration-file-input" id="registration-aadhar" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" aria-required="true" onChange={updateFile("aadhar", setAadharFile)} /></Button><small>{readingUploads.aadhar ? "Checking file…" : aadharFile ? "File validated · ready for submission" : "PNG, JPEG, or WebP, PDF · Max 2 MB"}</small></Box></div>
        <div className="form-group"><label htmlFor="registration-selfie">Selfie</label><Box className="team-registration-upload"><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} fullWidth disabled={isSubmitting || readingUploads.selfie}>{selfieFile ? "Selfie selected" : "Upload selfie"}<input className="team-registration-file-input" id="registration-selfie" type="file" accept="image/png,image/jpeg,image/webp" aria-required="true" onChange={updateFile("selfie", setSelfieFile)} /></Button><small>{readingUploads.selfie ? "Checking file…" : selfieFile ? "File validated · ready for submission" : "PNG, JPEG, or WebP · Max 2 MB"}</small></Box></div>
        <div className="form-group"><label htmlFor="registration-phonepe">PhonePe Number</label><input id="registration-phonepe" type="tel" required value={form.phonePe} onChange={(event) => updateField("phonePe", event.target.value)} /></div>
        <div className="form-group full"><label>Preferred Team Roles</label><div className="role-checkbox-grid">{TEAM_MEMBER_ROLES.map((role) => <label className="check-item" key={role}><input type="checkbox" checked={preferredRoles.includes(role)} onChange={() => setPreferredRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} />{role}</label>)}</div></div>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <Button type="submit" variant="contained" className="primary-button full-width" disabled={isSubmitting || readingUploads.aadhar || readingUploads.selfie} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}>{isSubmitting ? "Submitting registration…" : readingUploads.aadhar || readingUploads.selfie ? "Checking uploads…" : "Submit Registration"}</Button>
      <p className="form-note">ID and selfie images are stored with your application for admin review.</p>
    </form>
  );
}
