'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/app/style';
import { ChildrenProps } from '@/common/type/props.type';

export default function ThemeRegistry({ children }: ChildrenProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
