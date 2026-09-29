import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#263445", contrastText: "#ffffff" },
    secondary: { main: "#b99157", contrastText: "#18212d" },
    success: { main: "#1d8f5f" },
    warning: { main: "#d88720" },
    error: { main: "#c74444" },
    background: { default: "#f5f2ec", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { styleOverrides: { root: { border: "1px solid rgba(17, 24, 39, 0.08)" } } },
  },
});

export default theme;
