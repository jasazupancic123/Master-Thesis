'use client';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';
import { AthleteProvider } from '@/store/athlete-provider';
import { TrainingProvider, useTraining } from '@/store/training-provider';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <AthleteProvider>
        <TrainingProvider>
          <TrainingContent>{children}</TrainingContent>
        </TrainingProvider>
      </AthleteProvider>
    </Box>
  );
}

function TrainingContent({ children }: ChildrenProps) {
  const { view } = useTraining(); // ✅ Call the hook inside a component

  return (
    <>
      {view === 'exercises' && <SidebarAthlete />}
      <Container component="main" sx={{ px: '0px !important' }}>
        <Box>{children}</Box>
      </Container>
    </>
  );
}
