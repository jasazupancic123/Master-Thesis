import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { Group } from '@/core/institution/type/group.type';
import type { Training } from '@/core/training/type/training.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export default function useTrainingPlan(
  trainings: Training[],
  groups: Group[]
) {
  const { user } = useAuthenticatedAuth();
  const [selectedGroups, setSelectedGroups] = useState<Group[]>(groups);
  const [completedTrainings, setCompletedTrainings] = useState<Training[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [onlyMySessions, setOnlyMySessions] = useState<boolean>(false);

  useEffect(() => {
    const completed: Training[] = [];
    const upcoming: Training[] = [];

    trainings.forEach((t) => {
      const isUpcoming = dayjs(t.from).isAfter(dayjs());

      if (isUpcoming) upcoming.push(t);
      else completed.push(t);
    });

    const filterFn = (t: Training) =>
      onlyMySessions ? t.ownerId === user.uid : true;

    setCompletedTrainings(completed.filter(filterFn));
    setUpcomingTrainings(upcoming.filter(filterFn));
  }, [trainings, onlyMySessions]);

  return {
    completedTrainings,
    upcomingTrainings,
    selectedGroups,
    setSelectedGroups,
    onlyMySessions,
    setOnlyMySessions,
  };
}
