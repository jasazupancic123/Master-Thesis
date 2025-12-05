import { useEffect, useState } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import { useMain } from '@/store/main.provider';
import { useTrainingRecap } from '@/store/training-recap.provider';

export default function useTrainingRecapSelectedExercises() {
  const { exercises } = useMain();

  const { workloads } = useTrainingRecap();

  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  const [searchExercise, setSearchExercise] = useState<string>('');

  useEffect(() => {
    const exerciseIds = workloads.map((w) => w.exerciseId);

    const allExercises = exercises.filter((e) => exerciseIds.includes(e.id));

    if (searchExercise.trim() === '') {
      setFilteredExercises(allExercises);
      return;
    }

    const lowerSearch = searchExercise.toLowerCase();

    const searchedExercises = allExercises.filter((exercise) =>
      exercise.name?.toLowerCase().includes(lowerSearch)
    );

    setFilteredExercises(searchedExercises);
  }, [searchExercise, workloads]);

  return {
    filteredExercises,
    searchExercise,
    setSearchExercise,
  };
}
