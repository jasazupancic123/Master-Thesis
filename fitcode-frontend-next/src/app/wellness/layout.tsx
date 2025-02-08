import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <SidebarAthlete title="WELLNESS" />

      <Container component="main" maxWidth="lg">
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
