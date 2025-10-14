import { useState } from 'react';

import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export type UseSupersetExercisesReturnType = ReturnType<
  typeof useSupersetsExercises
>;

export default function useSupersetsExercises() {
  const [menuExercise, setMenuExercise] = useState<TrainingExercise | null>(
    null
  );

  const [activeExercise, setActiveExercise] = useState<TrainingExercise | null>(
    null
  );

  const [selectedExercise, setSelectedExercise] =
    useState<TrainingExercise | null>(null);

  return {
    menuExercise,
    setMenuExercise,
    activeExercise,
    setActiveExercise,
    selectedExercise,
    setSelectedExercise,
  };
}
