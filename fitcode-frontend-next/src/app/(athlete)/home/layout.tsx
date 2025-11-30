'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AthleteHeader from '@/components/athlete/athlete-header';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { LINK_ATHLETE_HOME } from '@/lib/common/const/nav.const';
import { AthleteHeaderProvider } from '@/store/athlete-header.provider';
import { useMain } from '@/store/main.provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <AthleteHeaderProvider>
      <Box bgcolor="background.default" minHeight="100vh">
        <TrainingContent>{children}</TrainingContent>
      </Box>
    </AthleteHeaderProvider>
  );
}

function TrainingContent({ children }: React.PropsWithChildren) {
  const router = useRouter();

  const { activeTraining } = useMain();

  const pathname = usePathname();

  const [includeHeader, setIncludeHeader] = useState<boolean>(false);

  useEffect(() => {
    setIncludeHeader(!pathname.includes('/components/'));
  }, [pathname]);

  useEffect(() => {
    if (!activeTraining?.statuses?.length) return;

    const inProgress = activeTraining.statuses.find(
      (s) => s.status === TrainingStatus.IN_PROGRESS
    );

    if (inProgress?.componentId && activeTraining?.id) {
      // Use replace so the user can't "back" into the pre-redirect state
      router.replace(
        `${LINK_ATHLETE_HOME.href}/${activeTraining.id}/components/${inProgress.componentId}`
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
