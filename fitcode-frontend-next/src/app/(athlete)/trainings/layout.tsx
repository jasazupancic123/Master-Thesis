'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import AthleteHeader from '@/components/athlete/athlete-header';
import TrainingsInitializer from '@/initializers/trainings.initializer';
import { AthleteHeaderProvider } from '@/store/athlete-header.provider';
import { useMain } from '@/store/main.provider';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Layout({ children }: React.PropsWithChildren) {
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

function TrainingContent({ children }: React.PropsWithChildren) {
  const router = useRouter();

  const { activeTraining } = useMain();

  const pathname = usePathname();

  const includeHeader = !pathname.includes('/components/');

  useEffect(() => {
    if (!activeTraining?.report?.componentStatuses?.length) return;

    const inProgress = activeTraining.report.componentStatuses.find(
      (s) => s.status === TrainingStatus.IN_PROGRESS
    );

    if (inProgress?.componentId && activeTraining.training?.id) {
      // Use replace so the user can't "back" into the pre-redirect state
      router.replace(
        `/trainings/${activeTraining.training.id}/components/${inProgress.componentId}`
      );
    }
  }, [router, activeTraining]); // run when activeTraining changes

  return (
    <>
      {includeHeader && <AthleteHeader />}

      <Container component="main" sx={{ px: '0px !important' }}>
        <Box>{children}</Box>
      </Container>
    </>
  );
}
