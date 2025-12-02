import CoachTrainingStationInitializer from '@/initializers/coach-training-station.initializer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <CoachTrainingStationInitializer>
      {children}
    </CoachTrainingStationInitializer>
  );
}
