import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { Training } from '@/core/training/type/training.type';
import { useDashboard } from '@/store/dashboard.provider';

export default function useTrainingPlan() {
  const { trainings, selectedGroups } = useDashboard();

  const [completedTrainings, setCompletedTrainings] = useState<Training[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);

  useEffect(() => {
    const completed: Training[] = [];
    const upcoming: Training[] = [];

    trainings
      .filter((t) => selectedGroups.some((g) => g.id === t.groupId))
      .forEach((t) => {
        const isUpcoming = dayjs(t.from).isAfter(dayjs());

        if (isUpcoming) upcoming.push(t);
        else completed.push(t);
      });

    setCompletedTrainings(completed);
    setUpcomingTrainings(upcoming);
  }, [selectedGroups, trainings]);

  return {
    completedTrainings,
    upcomingTrainings,
  };
}
