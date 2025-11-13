'use client';

import { useAthlete } from '@/store/athlete.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: React.PropsWithChildren) {
  const { children } = props;
  const { trainings, reports } = useAthlete();

  const state = { trainings, reports };

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
