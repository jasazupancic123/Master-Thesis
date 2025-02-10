"use client"; // Ensures this component runs on the client

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/app/style";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
