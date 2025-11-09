import { Group } from '@/core/group/type/group.type';
import { Training } from '@/core/training/type/training.type';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

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
