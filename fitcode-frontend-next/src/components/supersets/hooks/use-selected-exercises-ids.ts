import { useEffect, useState } from 'react';

import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useSelectedExerciseIds() {
  const { component, selectedSubgroup, supersets } = useTrainerDayView();

  const [newAddedExercisesIds, setNewAddedExercisesIds] = useState<string[]>(
    []
  );

  const [selectedExerciseIds, setSelectedExerciseIds] = useState(
    supersets && supersets.length
      ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
      : []
  );

  useEffect(() => {
    setSelectedExerciseIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!selectedSubgroup && !component) setSelectedExerciseIds([]);
  }, [component, selectedSubgroup]);

  return {
    selectedExerciseIds,
    setSelectedExerciseIds,
    newAddedExercisesIds,
    setNewAddedExercisesIds,
  };
}
