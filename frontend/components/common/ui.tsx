"use client";

import { Box, Button, Card, CardContent, IconButton, Typography } from "@mui/material";
import type { ButtonProps, CardProps, IconButtonProps } from "@mui/material";
import type { ReactNode } from "react";

export function SectionCard({ children, title, action, ...props }: CardProps & { title?: string; action?: ReactNode }) {
  return <Card variant="outlined" {...props}><CardContent><Box sx={{ display: "grid", gap: 2 }}><Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>{title ? <Typography variant="h6" component="h2">{title}</Typography> : <span />}{action}</Box>{children}</Box></CardContent></Card>;
}

export function AppButton(props: ButtonProps) {
  return <Button disableElevation {...props} />;
}

export function IconActionButton(props: IconButtonProps) {
  return <IconButton size="small" {...props} />;
}
