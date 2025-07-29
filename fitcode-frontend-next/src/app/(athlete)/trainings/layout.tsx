'use client';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AthleteHeader from '@/components/athlete-header/athlete-header';
import { ChildrenProps } from '@/common/type/props.type';
import { useTraining } from '@/store/training-provider';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import TrainingsInitializer from '@/initializers/trainings.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <TrainingsInitializer>
        <TrainingContent> {children}</TrainingContent>
      </TrainingsInitializer>
    </Box>
  );
}

function TrainingContent({ children }: ChildrenProps) {
  const { view } = useTraining();

  return (
    <>
      {view === ExerciseTrainingView.ExerciseView && <AthleteHeader />}
      <Container component="main" sx={{ px: '0px !important' }}>
        <Box>{children}</Box>
      </Container>
    </>
  );
}
