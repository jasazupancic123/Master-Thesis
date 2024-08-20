import React from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/component/sidebar';
import Box from '@mui/material/Box';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Container component="main" maxWidth="lg">
      <Sidebar title="PROFILE" />

      <Box pt={20}>
        {children}
      </Box>
    </Container>
  );
}