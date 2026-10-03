import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#365c78", light: "#e8f1f7", dark: "#23445d", contrastText: "#ffffff" },
    secondary: { main: "#a87532", light: "#f7f0e5", dark: "#80521d", contrastText: "#ffffff" },
    success: { main: "#287a55" },
    warning: { main: "#a85d12" },
    error: { main: "#b3261e" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
    text: { primary: "#1d2733", secondary: "#5d6875" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40, paddingInline: 16, fontWeight: 700 },
      },
    },
    MuiCard: { styleOverrides: { root: { border: "1px solid rgba(29, 39, 51, 0.09)", borderRadius: 16, boxShadow: "0 6px 22px rgba(29, 39, 51, 0.045)" } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
    MuiTextField: { defaultProps: { size: "medium", variant: "outlined" } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 750, color: "#465464" } } },
  },
});

export default theme;
