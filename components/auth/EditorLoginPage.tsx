"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { EDITING_ROLES, type EditingRole } from "@/types/project";

export function EditorLoginPage() {
  const router = useRouter();
  const { loginEditor, createEditor } = useProjectContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registration, setRegistration] = useState({ name: "", email: "", phone: "", username: "", password: "" });
  const [editingRoles, setEditingRoles] = useState<EditingRole[]>([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!loginEditor(username, password)) {
      setError("Editor login was not found. Register an editor account or check your credentials.");
      return;
    }
    router.replace("/editor");
  };

  const handleRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(registration).some((value) => !value.trim()) || editingRoles.length === 0) {
      setError("Complete all fields and choose at least one editing specialty.");
      return;
    }

    const created = createEditor({ ...registration, email: registration.email.trim().toLowerCase(), editingRoles });
    if (!created) {
      setError("An editor account already exists with that email or username.");
      return;
    }
    setRegistered(true);
    setError("");
  };

  return <div className="role-login-shell"><div className="role-login-container team-surface">
    <Link href="/" className="back-link">← Back</Link>
    <div className="role-login-header team-header"><div className="role-icon">✂</div><h1>Editor Workspace</h1><p>Register your editing specialties. Admin will assign completed event work directly.</p></div>
    <div className="role-login-form">
      {showRegistration ? registered ? <>
        <div className="success-box">Editor registration complete. Sign in to see work assigned to you by admin.</div>
        <button type="button" className="primary-button full-width" onClick={() => { setShowRegistration(false); setRegistered(false); }}>Continue to Sign In</button>
      </> : <form className="form-stack" onSubmit={handleRegistration}>
        <h2>Editor Registration</h2>
        <div className="form-group"><label htmlFor="editor-register-name">Full Name</label><input id="editor-register-name" required value={registration.name} onChange={(event) => setRegistration((current) => ({ ...current, name: event.target.value }))} /></div>
        <div className="form-group"><label htmlFor="editor-register-email">Email</label><input id="editor-register-email" type="email" required value={registration.email} onChange={(event) => setRegistration((current) => ({ ...current, email: event.target.value }))} /></div>
        <div className="form-group"><label htmlFor="editor-register-phone">Phone</label><input id="editor-register-phone" type="tel" required value={registration.phone} onChange={(event) => setRegistration((current) => ({ ...current, phone: event.target.value }))} /></div>
        <div className="form-group"><label htmlFor="editor-register-username">Username</label><input id="editor-register-username" required value={registration.username} onChange={(event) => setRegistration((current) => ({ ...current, username: event.target.value }))} /></div>
        <div className="form-group"><label htmlFor="editor-register-password">Password</label><input id="editor-register-password" type="password" required value={registration.password} onChange={(event) => setRegistration((current) => ({ ...current, password: event.target.value }))} /></div>
        <fieldset className="form-group full role-checkbox-fieldset"><legend>Editing specialties</legend><div className="role-checkbox-grid">{EDITING_ROLES.map((role) => <label className="check-item" key={role}><input type="checkbox" checked={editingRoles.includes(role)} onChange={() => setEditingRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} />{role}</label>)}</div></fieldset>
        {error ? <div className="error-box">{error}</div> : null}
        <button type="submit" className="primary-button full-width">Create Editor Account</button>
        <button type="button" className="secondary-button full-width" onClick={() => { setShowRegistration(false); setError(""); }}>Back to Sign In</button>
      </form> : <>
        <div className="form-group"><label htmlFor="editor-username">Username</label><input id="editor-username" value={username} onChange={(event) => setUsername(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="editor-password">Password</label><input id="editor-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {error ? <div className="error-box">{error}</div> : null}
        <button type="button" className="primary-button full-width" onClick={handleLogin}>Sign in to Editor Dashboard</button>
        <button type="button" className="secondary-button full-width" onClick={() => { setShowRegistration(true); setError(""); }}>Register as an Editor</button>
      </>}
    </div>
  </div></div>;
}