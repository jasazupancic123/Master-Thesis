import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { Group } from '@/core/group/type/group.type';
import type { Training } from '@/core/training/type/training.type';

export default function useTrainingPlan(
  trainings: Training[],
  groups: Group[]
) {
  const [selectedGroups, setSelectedGroups] = useState<Group[]>(groups);

  const [completedTrainings, setCompletedTrainings] = useState<Training[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);

  useEffect(() => {
    const completed: Training[] = [];
    const upcoming: Training[] = [];

    trainings.forEach((training) => {
      const isUpcoming = dayjs(training.from).isAfter(dayjs());

      if (isUpcoming) upcoming.push(training);
      else completed.push(training);
    });

    setCompletedTrainings(completed);
    setUpcomingTrainings(upcoming);
  }, [trainings]);

  return {
    completedTrainings,
    upcomingTrainings,
    selectedGroups,
    setSelectedGroups,
  };
}
