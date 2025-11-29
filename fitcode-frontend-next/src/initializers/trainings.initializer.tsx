'use client';

import { useAthlete } from '@/store/athlete.provider';
import { TrainingsProvider } from '@/store/trainings.provider';

export default function TrainingsInitializer(props: React.PropsWithChildren) {
  const { children } = props;
  const { reports } = useAthlete();

  const state = { reports };

  return <TrainingsProvider {...state}>{children}</TrainingsProvider>;
}
