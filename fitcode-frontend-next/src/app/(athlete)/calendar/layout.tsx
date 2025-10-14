'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import { AthleteHeaderProvider } from '@/store/athlete-header.provider';
import AthleteHeader from '@/components/athlete/athlete-header/athlete-header';

export default function Layout({ children }: ChildrenProps) {
  return (
    <AthleteHeaderProvider>
      <Box
        bgcolor="background.default"
        minHeight="100vh"
        padding={0}
        height="100%"
      >
        <AthleteHeader />

        <Container component="main" maxWidth="lg" sx={{ padding: 0 }}>
          <Box>{children}</Box>
        </Container>
      </Box>
    </AthleteHeaderProvider>
  );
}
