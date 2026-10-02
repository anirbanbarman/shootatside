"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Avatar, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";

import { useProjectContext } from "@/components/providers/ProjectProvider";
import { EDITING_ROLES, type EditingRole } from "@/types/project";

type EditorApplicationForm = {
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  phonePe: string;
  aadharFileName: string;
  aadharDataUrl: string;
  selfieFileName: string;
  selfieDataUrl: string;
};

const emptyApplication: EditorApplicationForm = {
  name: "", mobile: "", whatsapp: "", email: "", address: "", phonePe: "",
  aadharFileName: "", aadharDataUrl: "", selfieFileName: "", selfieDataUrl: "",
};

export function EditorLoginPage() {
  const router = useRouter();
  const { loginEditor, submitEditorApplication } = useProjectContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [application, setApplication] = useState(emptyApplication);
  const [editingRoles, setEditingRoles] = useState<EditingRole[]>([]);
  const [showApplication, setShowApplication] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const updatePhoto = (field: "aadhar" | "selfie") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Please choose an image or PDF smaller than 1.5 MB so it can be saved for admin review.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setApplication((current) => field === "aadhar"
      ? { ...current, aadharFileName: file.name, aadharDataUrl: String(reader.result ?? "") }
      : { ...current, selfieFileName: file.name, selfieDataUrl: String(reader.result ?? "") });
    reader.readAsDataURL(file);
    setError("");
  };

  const handleLogin = async () => {
    try {
      await loginEditor(username, password);
      router.replace("/editor");
    } catch {
      setError("Editor login was not found. Approved editor applications can sign in with the credentials set by admin.");
    }
  };

  const handleApplicationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(application).some((value) => !value.trim()) || editingRoles.length === 0) {
      setError("Complete all fields, upload both images, and select at least one editing specialty.");
      return;
    }
    try {
      await submitEditorApplication({ ...application, editingRoles });
      setSubmitted(true);
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit application. Please try again.");
    }
  };

  return <Box className="role-login-shell editor-login-shell">
    <Card variant="outlined" className="editor-auth-card">
      <CardContent>
        <Box className="role-login-header team-header">
          <Avatar className="editor-auth-avatar"><PhotoCameraOutlinedIcon /></Avatar>
          <Typography variant="h4" component="h1">Editor Workspace</Typography>
          <Typography color="text.secondary">Apply with your editing specialties. Admin reviews your profile and sets your sign-in credentials.</Typography>
        </Box>

        {showApplication ? submitted ? <Stack spacing={2}>
          <Alert severity="success">Application received.</Alert>
        </Stack> : <Box component="form" onSubmit={handleApplicationSubmit} className="editor-application-form">
          <Typography variant="h6" component="h2">Editor Application</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField required fullWidth label="Full name" value={application.name} onChange={(event) => setApplication((current) => ({ ...current, name: event.target.value }))} />
            <TextField required fullWidth label="Mobile number" type="tel" value={application.mobile} onChange={(event) => setApplication((current) => ({ ...current, mobile: event.target.value }))} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField required fullWidth label="WhatsApp number" type="tel" value={application.whatsapp} onChange={(event) => setApplication((current) => ({ ...current, whatsapp: event.target.value }))} />
            <TextField required fullWidth label="Email address" type="email" value={application.email} onChange={(event) => setApplication((current) => ({ ...current, email: event.target.value }))} />
          </Stack>
          <TextField required fullWidth multiline minRows={2} label="Address" value={application.address} onChange={(event) => setApplication((current) => ({ ...current, address: event.target.value }))} />
          <TextField required fullWidth label="PhonePe number" type="tel" value={application.phonePe} onChange={(event) => setApplication((current) => ({ ...current, phonePe: event.target.value }))} />
          <Stack className="editor-upload-row" direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box className="editor-upload-field"><Button variant="outlined" component="label" fullWidth>{application.aadharFileName || "Upload Aadhar / ID image"}<input hidden type="file" accept="image/*,.pdf" onChange={updatePhoto("aadhar")} /></Button>{application.aadharDataUrl.startsWith("data:image/") ? <img className="editor-upload-preview" src={application.aadharDataUrl} alt="ID document preview" /> : null}</Box>
            <Box className="editor-upload-field"><Button variant="outlined" component="label" fullWidth>{application.selfieFileName || "Upload selfie"}<input hidden type="file" accept="image/*" onChange={updatePhoto("selfie")} /></Button>{application.selfieDataUrl ? <img className="editor-upload-preview" src={application.selfieDataUrl} alt="Selfie preview" /> : null}</Box>
          </Stack>
          <fieldset className="editor-specialty-fieldset"><legend>Editing specialties</legend><Stack direction={{ xs: "column", sm: "row" }} sx={{ flexWrap: "wrap", gap: 1 }}>{EDITING_ROLES.map((role) => <FormControlLabel key={role} control={<Checkbox checked={editingRoles.includes(role)} onChange={() => setEditingRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} />} label={role} />)}</Stack></fieldset>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" startIcon={<PersonAddAltOutlinedIcon />}>Submit editor application</Button>
          <Button type="button" variant="text" onClick={() => { setShowApplication(false); setError(""); }}>Back to sign in</Button>
        </Box> : <Stack spacing={2.5} className="editor-signin-form">
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button variant="contained" startIcon={<LoginOutlinedIcon />} onClick={handleLogin}>Sign in to Editor Dashboard</Button>
          <Button variant="outlined" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => { setShowApplication(true); setError(""); }}>Apply as an Editor</Button>
        </Stack>}
      </CardContent>
    </Card>
  </Box>;
}