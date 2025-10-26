import { useState } from 'react';

import type { TrainingExercise } from '@/core/training/type/training-exercise.type';

export type SupersetExercisesHook = ReturnType<typeof useSupersetExercises>;

export default function useSupersetExercises() {
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
