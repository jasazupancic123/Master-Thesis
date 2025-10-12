import { TrainingExerciseCardProps } from '@/components/trainer-day-view/props';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useTrainingExerciseCardParams(
  props: TrainingExerciseCardProps
) {
  const { training, component, selectedSubgroup } = useTrainerDayViewContext();

  const { supersetIndex, exercise } = props;

  const componentIndex = training?.components.findIndex(
    (c) => c.id === component?.id
  );

  const selectedTrainingOrSubgroup =
    selectedSubgroup || training?.components?.[componentIndex!];

  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValuesL?.map((pv) =>
      Array.isArray(exercise.params)
        ? exercise?.params?.find((p) => p.field === pv.field)
        : Object.values(exercise.params).find(
            (p) => (p as Attribute).field === pv.field
          )
    ) ||
    []?.filter((p) => p) ||
    [];

  return { params, componentIndex };
}
