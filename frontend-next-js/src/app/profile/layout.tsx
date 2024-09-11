import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/common/components/sidebar';
import Box from '@mui/material/Box';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
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