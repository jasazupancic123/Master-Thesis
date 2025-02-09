import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar';
import Box from '@mui/material/Box';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <Box bgcolor="background.paper" minHeight="calc(100vh - 136px)">
      <Container component="main" maxWidth="lg">
        <Sidebar title="EXERCISES" />

        <Box mt="136px">{children}</Box>
      </Container>
    </Box>
  );
}
