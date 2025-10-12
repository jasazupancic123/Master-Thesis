import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useEffect, useState } from 'react';

export default function useSelectedExercisesIds() {
  const { component, selectedSubgroup, supersets } = useTrainerDayViewContext();

  const [selectedExercisesIds, setSelectedExercisesIds] = useState(
    supersets && supersets.length
      ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
      : []
  );

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!selectedSubgroup && !component) setSelectedExercisesIds([]);
  }, [component, selectedSubgroup]);

  return {
    selectedExercisesIds,
    setSelectedExercisesIds,
  };
}
