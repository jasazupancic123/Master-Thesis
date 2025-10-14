import { useEffect, useState } from 'react';

import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';

interface UseExerciseCollapsedSetsSetNumberProps {
  exercise: TrainingExercise;
}

export default function useExerciseCollapsedSetsSetNumber(
  props: UseExerciseCollapsedSetsSetNumberProps
) {
  const { setsNumbers } = useSupersets();

  const { exercise } = props;

  const [setNumber, setSetsNumber] = useState(
    setsNumbers.find((sn) => sn.exerciseId === exercise.id)?.setsNumber ||
      undefined
  );

  useEffect(() => {
    setSetsNumber(
      setsNumbers.find((sn) => sn.exerciseId === exercise.id)?.setsNumber
    );
  }, [setsNumbers]);

  return {
    setNumber,
    setSetsNumber,
  };
}
