"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { ReactNode } from "react";

import theme from "@/theme";

export function MaterialUIProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline /><LocalizationProvider dateAdapter={AdapterDayjs}>{children}</LocalizationProvider></ThemeProvider>;
}
