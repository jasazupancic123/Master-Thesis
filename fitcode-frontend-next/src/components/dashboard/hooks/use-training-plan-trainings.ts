import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { Training } from '@/core/training/type/training.type';
import { useDashboard } from '@/store/dashboard.provider';

export default function useTrainingPlan() {
  const { trainings } = useDashboard();

  console.log('trainings in useTrainingPlan', trainings);

  const [completedTrainings, setCompletedTrainings] = useState<Training[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);

  useEffect(() => {
    const completed: Training[] = [];
    const upcoming: Training[] = [];

    trainings.forEach((t) => {
      const isUpcoming = dayjs(t.from).isAfter(dayjs());

      if (isUpcoming) upcoming.push(t);
      else completed.push(t);
    });

    setCompletedTrainings(completed);
    setUpcomingTrainings(upcoming);
  }, [trainings]);

  return {
    completedTrainings,
    upcomingTrainings,
  };
}
