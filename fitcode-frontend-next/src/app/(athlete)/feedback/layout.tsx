'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import AthleteHeader from '@/components/athlete-header/athlete-header';
import WellnessInitializer from '@/initializers/wellness.initializer';
import { AthleteHeaderProvider } from '@/store/athlete-header.provider';

export default function Layout({ children }: ChildrenProps) {
  return (
    <AthleteHeaderProvider>
      <Box bgcolor="background.default" minHeight="100vh">
        <AthleteHeader />

        <Container component="main" maxWidth="lg" sx={{ px: '0px !important' }}>
          <WellnessInitializer>{children}</WellnessInitializer>
        </Container>
      </Box>
    </AthleteHeaderProvider>
  );
}
