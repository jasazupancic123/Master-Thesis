import { SetState, SetStateNullable } from '@/common/type/state.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import { Method } from '@/controller/method/type/method.type';
import { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { Training } from '@/controller/training/type/training.type';

function updateParamValuesWithMethodRanges(input: {
  method: Method | undefined;
  p: AttributeValue;
}) {
  const { method, p } = input;

  let attributeRange = method?.attributes
    ?.map((a) => a.options?.find((o) => o.field === p.selected))
    .find(Boolean);
  if (!attributeRange) return p;

  const foundInOptions = attributeRange.options?.find(
    (o) => o.field === p.selected
  );
  if (foundInOptions) attributeRange = foundInOptions;

  try {
    const numValue = parseFloat(p.value);
    if (attributeRange.min !== undefined && numValue < attributeRange.min) {
      return {
        ...p,
        value: attributeRange.min.toString(),
      };
    }
    if (attributeRange.max !== undefined && numValue > attributeRange.max) {
      return {
        ...p,
        value: attributeRange.max.toString(),
      };
    }
    return p;
  } catch (_: unknown) {
    return p;
  }
}

function updateSetValuesWithMethodRanges(input: {
  set: ExerciseSet;
  method?: Method;
}): ExerciseSet {
  const { set, method } = input;
  return {
    ...set,
    paramValuesL: set.paramValuesL.map((p) => {
      return updateParamValuesWithMethodRanges({
        method,
        p,
      });
    }),
    paramValuesR: set.paramValuesR?.map((p) => {
      return updateParamValuesWithMethodRanges({
        method,
        p,
      });
    }),
  };
}

function updateSetsNumbersWithMethodRanges(input: {
  e: TrainingExercise;
  min: number | undefined;
  max: number | undefined;
}) {
  const { e, min, max } = input;
  let nextSetNumber = e.sets.length + 1;

  if (min !== undefined && e.sets.length < min) {
    const deficit = Math.max(0, min - e.sets.length);
    const start = nextSetNumber;

    const extraSets: ExerciseSet[] = Array.from(
      { length: deficit },
      (_, i) => ({
        ...e.sets[e.sets.length - 1],
        setNumber: start + i,
      })
    );

    nextSetNumber += deficit;

    return e.sets.concat(extraSets);
  } else if (max !== undefined && e.sets.length > max) {
    return e.sets.slice(0, max);
  }
  return e.sets;
}

export function onMethodChange(
  input: {
    methodId: string;
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    allMethods: Method[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
  }
) {
  const { methodId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    allMethods,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
  } = state;

  const method = allMethods.find((m) => m.id === methodId);

  const updatedComponent: TrainingComponent = {
    ...component,
    method: method,
    methodId: method?.id,
    supersets: component.supersets?.map((s) => ({
      ...s,
      exercises: s.exercises.map((e) => ({
        ...e,
        attributeRanges: method?.attributes || [],
        sets: e.sets.map((set) =>
          updateSetValuesWithMethodRanges({
            set,
            method,
          })
        ),
      })),
    })),
    subgroups: component.subgroups.map((sg) => ({
      ...sg,
      supersets: sg.supersets.map((s) => ({
        ...s,
        exercises: s.exercises.map((e) => ({
          ...e,
          attributeRanges: method?.attributes || [],
          sets: e.sets.map((set) =>
            updateSetValuesWithMethodRanges({
              set,
              method,
            })
          ),
        })),
      })),
    })),
  };

  const setsRange = method?.attributes
    ?.map((a) => a.options?.find((o) => o.field === VolWorkSetType.Set))
    .find(Boolean);

  // update sets numbers here if method has ranges for sets
  if (setsRange) {
    const { min, max } = setsRange;

    if (min !== undefined || max !== undefined) {
      updatedComponent.supersets = updatedComponent.supersets.map((s) => ({
        ...s,
        exercises: s.exercises.map((e) => ({
          ...e,
          sets: updateSetsNumbersWithMethodRanges({
            e,
            min,
            max,
          }),
        })),
      }));

      updatedComponent.subgroups = updatedComponent.subgroups.map((sg) => ({
        ...sg,
        supersets: sg.supersets.map((s) => ({
          ...s,
          exercises: s.exercises.map((e) => {
            return {
              ...e,
              sets: updateSetsNumbersWithMethodRanges({
                e,
                min,
                max,
              }),
            };
          }),
        })),
      }));
    }
  }

  if (selectedSubgroup) {
    const foundSubgroup = updatedComponent.subgroups.find(
      (sg) => sg.id === selectedSubgroup.id
    );

    if (foundSubgroup) setSelectedSubgroup(foundSubgroup);
  }

  setComponent(updatedComponent);

  const updatedComponents = training.components.map((c) => {
    if (c.id === component.id || c.component?.id === component.component?.id) {
      return {
        ...updatedComponent,
      };
    }
    return c;
  });

  setTraining((prev) =>
    !prev
      ? prev
      : {
          ...prev,
          components: updatedComponents,
        }
  );

  setDetectedChanges(true);
}
