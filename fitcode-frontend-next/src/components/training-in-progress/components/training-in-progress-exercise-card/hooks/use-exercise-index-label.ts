import { useMemo, useRef } from 'react';

import { MainSet } from '@/controller/training/enum/main-set.enum';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function useExerciseIndexLabel() {
  const labelRef = useRef<string>('');

  const { trainingInProgress } = useTraining();

  const { exerciseIndex, supersetIndex } = useTrainingInProgress();

  const isCircuit =
    trainingInProgress?.selectedComponent.mainSet === MainSet.CIRCUIT;

  const computedLabel = useMemo(() => {
    if (typeof exerciseIndex !== 'number' || typeof supersetIndex !== 'number')
      return labelRef.current;

    if (isCircuit) return String(exerciseIndex + 1);

    const letter = String.fromCharCode(65 + exerciseIndex);
    labelRef.current = `${supersetIndex + 1}${letter}`;
    return `${supersetIndex + 1}${letter}`;
  }, [exerciseIndex]);

  if (computedLabel) labelRef.current = computedLabel;

  return { label: labelRef.current };
}
