import { Box } from '@mui/material';

import CoachTrainingInitializer from '@/initializers/coach-training.initializer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box bgcolor="background.default">
      <CoachTrainingInitializer>{children}</CoachTrainingInitializer>
    </Box>
  );
}
