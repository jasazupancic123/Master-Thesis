import { Box } from '@mui/material';

import TrainingInitializer from '@/initializers/training.initializer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box bgcolor="background.default" minHeight="100dvh">
      <TrainingInitializer>{children}</TrainingInitializer>
    </Box>
  );
}
