import { Group } from '@/core/group/type/group.type';
import { Training } from '@/core/training/type/training.type';
import { useEffect, useState } from 'react';

export default function useFilteredTrainingsList(
  trainings: Training[],
  selectedGroups: Group[]
) {
  const [filteredTrainings, setFilteredTrainings] = useState<Training[]>([]);

  useEffect(() => {
    const filtered = trainings.filter((training) =>
      selectedGroups.some((group) => group.id === training.groupId)
    );
    setFilteredTrainings(filtered);
  }, [trainings, selectedGroups]);

  return {
    filteredTrainings,
  };
}
