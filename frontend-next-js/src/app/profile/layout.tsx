import React from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/component/sidebar';
import Box from '@mui/material/Box';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box bgcolor="background.paper" minHeight="calc(100vh - 64px)">
      <Container component="main" maxWidth="lg">
        <Sidebar title="PROFILE" />

        <Box mt="64px">
          {children}
        </Box>
      </Container>
    </Box>
  );
}