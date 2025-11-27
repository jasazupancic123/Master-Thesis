'use client';

import { useAthlete } from '@/store/athlete.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: React.PropsWithChildren) {
  const { children } = props;
  const { reports } = useAthlete();

  const state = { reports };

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
