'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import TrainingsInitializer from '@/initializers/trainings.initializer';
import { AthleteHeaderProvider } from '@/store/athlete-header.provider';
import AthleteHeader from '@/components/athlete/athlete-header/athlete-header';

export default function Layout({ children }: ChildrenProps) {
  return (
    <AthleteHeaderProvider>
      <Box bgcolor="background.default" minHeight="100vh">
        <TrainingsInitializer>
          <TrainingContent>{children}</TrainingContent>
        </TrainingsInitializer>
      </Box>
    </AthleteHeaderProvider>
  );
}

function TrainingContent({ children }: ChildrenProps) {
  return (
    <>
      <AthleteHeader />

      <Container component="main" sx={{ px: '0px !important' }}>
        <Box>{children}</Box>
      </Container>
    </>
  );
}
