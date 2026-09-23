"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { TEAM_MEMBER_ROLES, type TeamMemberRole } from "@/types/project";
import type { TeamUserType } from "@/types/project";

export function TeamRegistrationForm({ onComplete }: { onComplete: () => void }) {
  const { registerTeam } = useProjectContext();
  const [form, setForm] = useState({ name: "", mobile: "", whatsapp: "", email: "", address: "", phonePe: "" });
  const [userType, setUserType] = useState<TeamUserType>("Member");
  const [preferredRoles, setPreferredRoles] = useState<TeamMemberRole[]>([]);
  const [aadharFileName, setAadharFileName] = useState("");
  const [selfieFileName, setSelfieFileName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateFile = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(event.target.files?.[0]?.name ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim()) || !aadharFileName || !selfieFileName || preferredRoles.length === 0) {
      setError("Please complete every field, select both files, and choose at least one preferred role.");
      return;
    }

    registerTeam({ ...form, aadharFileName, selfieFileName, userType, preferredRoles });
    setError("");
    setSuccess(true);
  };

  if (success) {
    return <div className="success-box">Registration submitted. Admin approval is required before you can log in.<button type="button" className="secondary-button" onClick={onComplete}>Back to Login</button></div>;
  }

  return (
    <form className="team-registration-form" onSubmit={handleSubmit}>
      <div className="team-form-grid">
        <div className="form-group"><label htmlFor="registration-name">Full Name</label><input id="registration-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-mobile">Mobile Number</label><input id="registration-mobile" type="tel" required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-whatsapp">WhatsApp Number</label><input id="registration-whatsapp" type="tel" required value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-email">Email ID</label><input id="registration-email" type="email" required value={form.email} onChange={(event) => updateField("email", event.target.value)} /></div>
        <div className="form-group full"><label htmlFor="registration-address">Address</label><textarea id="registration-address" required value={form.address} onChange={(event) => updateField("address", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-aadhar">Aadhar Card Upload</label><input id="registration-aadhar" type="file" accept="image/*,.pdf" required onChange={updateFile(setAadharFileName)} /></div>
        <div className="form-group"><label htmlFor="registration-selfie">Selfie</label><input id="registration-selfie" type="file" accept="image/*" required onChange={updateFile(setSelfieFileName)} /></div>
        <div className="form-group"><label htmlFor="registration-phonepe">PhonePe Number</label><input id="registration-phonepe" type="tel" required value={form.phonePe} onChange={(event) => updateField("phonePe", event.target.value)} /></div>
        <div className="form-group"><label htmlFor="registration-user-type">User Type</label><select id="registration-user-type" value={userType} onChange={(event) => setUserType(event.target.value as TeamUserType)}><option value="Team Leader">Team Leader</option><option value="Member">Member</option></select></div>
        <div className="form-group full"><label>Preferred Team Roles</label><div className="role-checkbox-grid">{TEAM_MEMBER_ROLES.map((role) => <label className="check-item" key={role}><input type="checkbox" checked={preferredRoles.includes(role)} onChange={() => setPreferredRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} />{role}</label>)}</div></div>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <button type="submit" className="primary-button full-width">Submit Registration</button>
      <p className="form-note">Files are captured for this demo and visible to the admin as file names.</p>
    </form>
  );
}
