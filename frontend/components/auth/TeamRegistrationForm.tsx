"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Box, Button } from "@mui/material";
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

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateFile = (setter: (value: { name: string; dataUrl: string } | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setter(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Each upload must be 2 MB or smaller.");
      event.target.value = "";
      setter(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter({ name: file.name, dataUrl: reader.result });
        setError("");
      } else {
        setError("Unable to read the selected file. Please try again.");
      }
    };
    reader.onerror = () => setError("Unable to read the selected file. Please try again.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim()) || !aadharFile || !selfieFile || preferredRoles.length === 0) {
      setError("Please complete every field, select both files, and choose at least one team role.");
      return;
    }

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
    }
  };

  if (success) {
    return <div className="success-box" role="status">Registration received.</div>;
  }

  return (
    <form className="team-registration-form" onSubmit={handleSubmit}>
      <div className="team-form-grid">
        <div className="form-group"><label htmlFor="registration-name">Full Name</label><input id="registration-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-mobile">Mobile Number</label><input id="registration-mobile" type="tel" required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-whatsapp">WhatsApp Number</label><input id="registration-whatsapp" type="tel" required value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-email">Email ID</label><input id="registration-email" type="email" required value={form.email} onChange={(event) => updateField("email", event.target.value)} /></div>
        <div className="form-group full"><label htmlFor="registration-address">Address</label><textarea id="registration-address" required value={form.address} onChange={(event) => updateField("address", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-aadhar">Aadhar Card Upload</label><Box className="team-registration-upload"><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} fullWidth>{aadharFile ? "ID document selected" : "Upload ID image or PDF"}<input className="team-registration-file-input" id="registration-aadhar" type="file" accept="image/*,.pdf" required onChange={updateFile(setAadharFile)} /></Button><small>{aadharFile ? "File ready for submission" : "PNG, JPEG, or PDF · Max 2 MB"}</small></Box></div>
        <div className="form-group"><label htmlFor="registration-selfie">Selfie</label><Box className="team-registration-upload"><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} fullWidth>{selfieFile ? "Selfie selected" : "Upload selfie"}<input className="team-registration-file-input" id="registration-selfie" type="file" accept="image/*" required onChange={updateFile(setSelfieFile)} /></Button><small>{selfieFile ? "File ready for submission" : "Image · Max 2 MB"}</small></Box></div>
        <div className="form-group"><label htmlFor="registration-phonepe">PhonePe Number</label><input id="registration-phonepe" type="tel" required value={form.phonePe} onChange={(event) => updateField("phonePe", event.target.value)} /></div>
        <div className="form-group full"><label>Preferred Team Roles</label><div className="role-checkbox-grid">{TEAM_MEMBER_ROLES.map((role) => <label className="check-item" key={role}><input type="checkbox" checked={preferredRoles.includes(role)} onChange={() => setPreferredRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} />{role}</label>)}</div></div>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <button type="submit" className="primary-button full-width">Submit Registration</button>
      <p className="form-note">ID and selfie images are stored with your application for admin review.</p>
    </form>
  );
}
