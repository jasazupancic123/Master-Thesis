'use client';

import TrainingsTimeChart from '@/components/dashboard/trainings-time-chart';
import { useDashboard } from '@/store/dashboard.provider';

export default function Page() {
  const { trainings } = useDashboard();

  return (
    <>
      <TrainingsTimeChart trainings={trainings} />
    </>
  );
}
