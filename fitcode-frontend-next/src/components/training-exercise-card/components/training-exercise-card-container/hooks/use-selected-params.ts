import { isNumber } from '@/components/training-exercise-card/components/training-exercise-selected/actions/actions-number';
import { ParamType } from '@/controller/component/enum/param.enum';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';
import { useEffect, useState } from 'react';

interface UseTrainingExerciseCardSelectedParamsProps {
  exercise: TrainingExercise;
}

export type UseTrainingExerciseCardSelectedParamsReturnType = ReturnType<
  typeof useTrainingExerciseCardSelectedParams
>;

export default function useTrainingExerciseCardSelectedParams(
  props: UseTrainingExerciseCardSelectedParamsProps
) {
  const { exercise } = props;

  const { selectedExercise } = useSupersets();

  const [selectedParams, setSelectedParams] = useState<ParamType[]>([]);

  useEffect(() => {
    if (!selectedExercise) return;

    const numberParams = selectedExercise.params.filter((p) =>
      isNumber(
        selectedExercise,
        p.field as ParamType,
        exercise.sets[0].paramValuesL
      )
    );

    setSelectedParams(numberParams.map((p) => p.field as ParamType) || []);
  }, [selectedExercise]);

  return {
    selectedParams,
    setSelectedParams,
  };
}
