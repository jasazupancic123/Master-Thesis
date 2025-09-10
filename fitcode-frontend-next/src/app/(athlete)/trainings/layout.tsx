'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import AthleteHeader from '@/components/athlete-header/athlete-header';
import TrainingsInitializer from '@/initializers/trainings.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <TrainingsInitializer>
        <TrainingContent>{children}</TrainingContent>
      </TrainingsInitializer>
    </Box>
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
