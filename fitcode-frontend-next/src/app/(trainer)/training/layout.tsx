import { Box, Container } from '@mui/material';

import TrainerTrainingInProgressHeader from '@/components/trainer-training-in-progress/trainer-training-in-progress-header';

export default function Layout({ children }: React.PropsWithChildren) {
  const styles = {
    bgcolor: 'background.default',
    minHeight: `calc(100dvh - 64px)`,
  };

  return (
    <Box {...styles}>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          mx: 0,
          width: '100%',
        }}
      >
        <TrainerTrainingInProgressHeader />
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
