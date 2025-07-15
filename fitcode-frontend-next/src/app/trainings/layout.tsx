'use client';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';
import { AthleteProvider } from '@/store/athlete-provider';
import { useTraining } from '@/store/training-provider';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import TrainingsInitializer from '@/initializers/trainings.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <AthleteProvider>
        <TrainingsInitializer>
          <TrainingContent> {children}</TrainingContent>
        </TrainingsInitializer>
      </AthleteProvider>
    </Box>
  );
}

function TrainingContent({ children }: ChildrenProps) {
  const { view } = useTraining();

  return (
    <>
      {view === ExerciseTrainingView.ExerciseView && <SidebarAthlete />}
      <Container component="main" sx={{ px: '0px !important' }}>
        <Box>{children}</Box>
      </Container>
    </>
  );
}
