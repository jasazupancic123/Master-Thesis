import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar';
import Box from '@mui/material/Box';
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <Container component="main" maxWidth="lg">
      <Sidebar title="USERS" />

      <Box mt={20}>{children}</Box>
    </Container>
  );
}
