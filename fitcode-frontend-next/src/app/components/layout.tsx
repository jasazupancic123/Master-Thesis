import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar';
import Box from '@mui/material/Box';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <Container component="main" maxWidth="lg">
      <Sidebar title="SPORT COMPONENTS" />

      <Box mt={20}>{children}</Box>
    </Container>
  );
}
