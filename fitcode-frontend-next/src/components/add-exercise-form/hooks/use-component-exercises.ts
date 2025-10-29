import { useEffect, useState } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { useMain } from '@/store/main.provider';

export default function useExerciseFormComponentExercises(
  component: TrainingComponent
) {
  const { exercises: allExercises } = useMain();
  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!component) return;

    setComponentExercises(allExercises);
  }, [component]);

  return {
    componentExercises,
    setComponentExercises,
  };
}
