'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';

import { theme } from '@/app/style';

export default function ThemeRegistry({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
