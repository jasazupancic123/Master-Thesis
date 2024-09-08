import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <SidebarAthlete title="WELLNESS" />

      <Container component="main" maxWidth="lg">
        <Box>
          {children}
        </Box>
      </Container>
    </Box>
  );
}