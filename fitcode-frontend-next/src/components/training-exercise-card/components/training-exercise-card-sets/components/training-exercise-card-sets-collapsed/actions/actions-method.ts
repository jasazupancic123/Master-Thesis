import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { SupersetsProviderReturnType } from '@/store/supersets.provider';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export function getMethodMinMax(
  input: {
    exercise: TrainingExercise;
    attributeRange?: Attribute;
    valueL: AttributeValue;
    setNumber: number;
  },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
    useSupersets: SupersetsProviderReturnType;
  }
): { min: number | undefined; max: number | undefined } {
  const { exercise, attributeRange, valueL, setNumber } = input;

  const { useTrainerDayViewContext, useSupersets } = context;

  const { selectedExercises } = useTrainerDayViewContext;

  const { setsNumbers, setSetsNumbers } = useSupersets;

  let min: number | undefined;
  let max: number | undefined;

  if (!attributeRange) return { min, max };

  const foundInOptions = attributeRange.options?.find(
    (option) => option.field === valueL.selected
  );

  if (foundInOptions) {
    if (foundInOptions.field === VolWorkSetType.Set) {
      if (
        foundInOptions.min &&
        setNumber !== undefined &&
        setNumber < foundInOptions.min
      ) {
        if (
          selectedExercises.length &&
          selectedExercises.some((e) => e.id === exercise.id)
        ) {
          const updatedSetsNumbers = [...setsNumbers];

          for (const selectedExercise of selectedExercises) {
            const existingIndex = updatedSetsNumbers.findIndex(
              (sn) => sn.exerciseId === selectedExercise.id
            );

            const newSetNumber = {
              exerciseId: selectedExercise.id,
              setsNumber: foundInOptions.min,
            };

            if (existingIndex !== -1) {
              updatedSetsNumbers[existingIndex] = newSetNumber;
            } else {
              updatedSetsNumbers.push(newSetNumber);
            }
          }

          setSetsNumbers(updatedSetsNumbers);
        } else {
          const newSetNumber = {
            exerciseId: exercise.id,
            setsNumber: foundInOptions.min,
          };
          setSetsNumbers((prev) => {
            const existingIndex = prev.findIndex(
              (sn) => sn.exerciseId === exercise.id
            );
            if (existingIndex !== -1) {
              const newSetsNumber = [...prev];
              newSetsNumber[existingIndex] = newSetNumber;
              return newSetsNumber;
            }
            return [...prev, newSetNumber];
          });
        }
      }
      if (
        foundInOptions.max &&
        setNumber !== undefined &&
        setNumber > foundInOptions.max
      ) {
        if (
          selectedExercises.length &&
          selectedExercises.some((e) => e.id === exercise.id)
        ) {
          const updatedSetsNumbers = [...setsNumbers];

          for (const selectedExercise of selectedExercises) {
            const existingIndex = updatedSetsNumbers.findIndex(
              (sn) => sn.exerciseId === selectedExercise.id
            );

            const newSetNumber = {
              exerciseId: selectedExercise.id,
              setsNumber: foundInOptions.max,
            };

            if (existingIndex !== -1) {
              updatedSetsNumbers[existingIndex] = newSetNumber;
            } else {
              updatedSetsNumbers.push(newSetNumber);
            }
          }

          setSetsNumbers(updatedSetsNumbers);
        } else {
          const newSetNumber = {
            exerciseId: exercise.id,
            setsNumber: foundInOptions.max,
          };
          setSetsNumbers((prev) => {
            const existingIndex = prev.findIndex(
              (sn) => sn.exerciseId === exercise.id
            );
            if (existingIndex !== -1) {
              const newSetsNumber = [...prev];
              newSetsNumber[existingIndex] = newSetNumber;
              return newSetsNumber;
            }
            return [...prev, newSetNumber];
          });
        }
      }
    }
    min = foundInOptions.min;
    max = foundInOptions.max;
  } else {
    min = attributeRange.min;
    max = attributeRange.max;
  }

  return { min, max };
}
