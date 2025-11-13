'use client';

import { useState } from 'react';

import { useAthlete } from '@/store/athlete.provider';
import { useMain } from '@/store/main.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: React.PropsWithChildren) {
  const { children } = props;
  const { trainings, reports } = useAthlete();
  const { activeTraining } = useMain();
  const [state] = useState({ trainings, reports, activeTraining });

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
