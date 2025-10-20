import { useEffect, useState } from 'react';

import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
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
    if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
      setComponentExercises(allExercises);
      return;
    }

    setComponentExercises(
      allExercises.filter((exercise) =>
        exercise.components?.some((c) => c.parents.includes(component.id))
      )
    );
  }, [component]);

  return {
    componentExercises,
    setComponentExercises,
  };
}
