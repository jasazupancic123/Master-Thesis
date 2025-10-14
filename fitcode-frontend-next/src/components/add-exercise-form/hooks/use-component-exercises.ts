import { useEffect, useState } from 'react';

import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useMain } from '@/store/main.provider';

export interface UseExerciseFormComponentExercisesProps {
  component: TrainingComponent;
}

export type UseExerciseFormComponentExercisesReturnType = ReturnType<
  typeof useExerciseFormComponentExercises
>;

export default function useExerciseFormComponentExercises(
  props: UseExerciseFormComponentExercisesProps
) {
  const { exercises: allExercises } = useMain();

  const { component } = props;

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
