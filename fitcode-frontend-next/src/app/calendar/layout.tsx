'use client';

import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/user/components/sidebar-athlete';
import { useTheme } from '@mui/material/styles';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const theme = useTheme();
  return (
    <Box bgcolor="background.paper" minHeight="100vh" padding={0} height="100%">
      <SidebarAthlete />

      <Container component="main" maxWidth="lg" sx={{ padding: 0 }}>
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
