import React from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/component/sidebar';
import Box from '@mui/material/Box';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box bgcolor="background.paper" minHeight="calc(100vh - 136px)">
      <Container component="main" maxWidth="lg">
        <Sidebar title="EXERCISES" />

        <Box mt="136px">
          {children}
        </Box>
      </Container>
    </Box>
  );
}