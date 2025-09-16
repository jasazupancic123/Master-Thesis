'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <Container component="main" maxWidth="lg" sx={{ px: '0px !important' }}>
        {children}
      </Container>
    </Box>
  );
}
