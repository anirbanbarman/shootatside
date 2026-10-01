"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { ClientLoginPage } from "@/components/auth/ClientLoginPage";
import { ClientRequestForm } from "@/components/client/ClientRequestForm";
import { PortalShell } from "@/components/common/PortalShell";
import { useProjectContext } from "@/components/providers/ProjectProvider";

export default function NewClientRequestPage() {
  const router = useRouter();
  const { currentUser, isReady } = useProjectContext();

  if (!isReady) return null;
  if (!currentUser || currentUser.role !== "client") return <ClientLoginPage />;

  return <PortalShell role="client"><Box className="dashboard-shell client-request-route">
    <Box className="page-intro"><Box><Typography variant="overline" color="secondary">Client Portal</Typography><Typography variant="h4" component="h1" sx={{ fontWeight: 750 }}>New Photography Request</Typography><Typography color="text.secondary">Share the event details and our team will follow up.</Typography></Box><Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push("/client")}>Back to projects</Button></Box>
    <Card variant="outlined"><CardContent><ClientRequestForm onSuccess={() => router.push("/client")} /></CardContent></Card>
  </Box></PortalShell>;
}
