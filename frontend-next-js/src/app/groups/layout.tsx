import React from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar';
import Box from '@mui/material/Box';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box bgcolor="background.default" minHeight="calc(100vh - 64px)">
      <Container component="main" maxWidth="lg">
        <Sidebar />

        <Box mt="64px">
          {children}
        </Box>
      </Container>
    </Box>
  );
}