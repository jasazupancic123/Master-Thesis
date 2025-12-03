import CoachTrainingStationInitializer from '@/initializers/coach-training-station.initializer';
import { Box } from '@mui/material';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <CoachTrainingStationInitializer>
      {children}
    </CoachTrainingStationInitializer>
  );
}
