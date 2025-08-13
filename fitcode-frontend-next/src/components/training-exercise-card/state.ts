import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';

import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User } from '@/controller/user/type/user.type';

export function handleAthleteWorkloadsChange(
  input: {
    exercise: TrainingExercise;
    setNumber: number;
    param: Attribute;
    newValue: string;
    leftOrRight: 'L' | 'R';
  },
  state: {
    training: Training;
    selectedAthleteWorkloads: CompletedFutureWorkloads;
    setCustomAthleteWorkloads: SetState<Workload[]>;
    selectedAthlete?: User;
    customAthleteWorkloads: Workload[];
  },
  updateAllSets: boolean = false
) {
  const { exercise, setNumber, param, newValue, leftOrRight } = input;
  const {
    training,
    selectedAthleteWorkloads,
    setCustomAthleteWorkloads,
    selectedAthlete,
    customAthleteWorkloads,
  } = state;
  if (!selectedAthlete) return;

  if (updateAllSets) {
    // if workload not in selected athlete workloads (future), add it and retunr
    if (
      !selectedAthleteWorkloads.futureWorkloads.some(
        (fw) =>
          fw.trainingId === training.id &&
          fw.exerciseId === exercise.id &&
          fw.userId === selectedAthlete.uid &&
          fw.setNumber === setNumber
      )
    ) {
      return;
    }

    // the first set has been updated on non expanded view, update all sets
    let foundFutureWorkloads = selectedAthleteWorkloads.futureWorkloads.filter(
      (fw) =>
        fw.trainingId === training.id &&
        fw.exerciseId === exercise.id &&
        fw.userId === selectedAthlete.uid
    );

    const perscribedFieldName = getPerscribedFieldName(param, leftOrRight);
    if (!perscribedFieldName) {
      toast.error(`Invalid parameter field: ${param.field}`);
      return;
    }

    const foundAlreadyCustomWorkloads = customAthleteWorkloads.filter(
      (cw) =>
        cw.trainingId === training.id &&
        cw.exerciseId === exercise.id &&
        cw.userId === selectedAthlete.uid
    );

    const newCustomAthleteWorkloads = [] as Workload[];
    if (foundAlreadyCustomWorkloads.length) {
      foundFutureWorkloads = foundFutureWorkloads.filter(
        (fw) =>
          !foundAlreadyCustomWorkloads.some(
            (cw) =>
              cw.trainingId === fw.trainingId &&
              cw.exerciseId === fw.exerciseId &&
              cw.setNumber === fw.setNumber &&
              cw.userId === fw.userId
          )
      );

      for (const w of foundAlreadyCustomWorkloads) {
        const newCustomWorkload = {
          ...w,
          [perscribedFieldName]: newValue,
        };
        newCustomAthleteWorkloads.push(newCustomWorkload);
      }
    }

    for (const w of foundFutureWorkloads) {
      const newCustomWorkload = {
        ...w,
        [perscribedFieldName]: newValue,
      };
      newCustomAthleteWorkloads.push(newCustomWorkload);
    }

    setCustomAthleteWorkloads(newCustomAthleteWorkloads);
  } else {
    const foundFutureWorkload = selectedAthleteWorkloads.futureWorkloads.find(
      (fw) =>
        fw.trainingId === training.id &&
        fw.exerciseId === exercise.id &&
        fw.setNumber === setNumber &&
        fw.userId === selectedAthlete.uid
    );

    if (!foundFutureWorkload) {
      toast.error("Save the training to update athlete's workloads", {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }

    const perscribedFieldName = getPerscribedFieldName(param, leftOrRight);
    if (!perscribedFieldName) {
      toast.error(`Invalid parameter field: ${param.field}`);
      return;
    }

    const foundAlreadyCustomWorkload = customAthleteWorkloads.find(
      (cw) =>
        cw.trainingId === training.id &&
        cw.exerciseId === exercise.id &&
        cw.setNumber === setNumber &&
        cw.userId === selectedAthlete.uid
    );

    if (foundAlreadyCustomWorkload) {
      // if the workload is already custom, update it
      const newCustomWorkload = {
        ...foundAlreadyCustomWorkload,
        [perscribedFieldName]: newValue,
      };
      setCustomAthleteWorkloads((prev) =>
        prev.map((cw) =>
          cw.trainingId === newCustomWorkload.trainingId &&
          cw.exerciseId === newCustomWorkload.exerciseId &&
          cw.setNumber === newCustomWorkload.setNumber &&
          cw.userId === selectedAthlete.uid
            ? newCustomWorkload
            : cw
        )
      );
    } else {
      // if the workload is not already custom, create a new one
      const newFutureWorkload = {
        ...foundFutureWorkload,
        [perscribedFieldName]: newValue,
      };
      setCustomAthleteWorkloads((prev) => [...prev, newFutureWorkload]);
    }
  }
}

export function updateTraining(
  input: {
    exercises: TrainingExercise[];
  },
  state: {
    training: Training;
    component: TrainingComponent | null;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setTraining: SetStateNullable<Training>;
    setSupersets?: SetState<Superset[]>;
    isInited?: boolean;
    setIsInited?: SetState<boolean>;
  }
) {
  const { exercises } = input;

  const {
    training,
    component,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
    setTraining,
    setSupersets,
    isInited,
    setIsInited,
  } = state;

  if (!training || !component) return;

  const newSupersets = [...supersets];
  let updatedSubgroup = selectedSubgroup ? { ...selectedSubgroup } : undefined;
  let updatedComponent = { ...component };
  let detectedChanges = false;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    const supersetIndex = supersets.findIndex((s) =>
      s.exercises.some((e) => e.id === exercise.id)
    );
    if (supersetIndex === -1) continue;

    const newSuperset = { ...newSupersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );
    if (exerciseIndex === -1 || !training || !component) continue;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    newSupersets[supersetIndex] = newSuperset;
    detectedChanges = true;
  }

  if (!detectedChanges) return;

  ReactDOM.unstable_batchedUpdates(() => {
    if (isInited) setDetectedChanges(true);
    else setIsInited?.(true);

    if (selectedSubgroup) {
      updatedSubgroup = {
        ...updatedSubgroup!,
        supersets: newSupersets,
      };

      updatedComponent = {
        ...updatedComponent,
        subgroups: component.subgroups.map((s) =>
          s.id === updatedSubgroup?.id ? updatedSubgroup! : s
        ),
      };

      const updatedComponents = training.components.map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setSelectedSubgroup(updatedSubgroup!);

      setTraining(newTraining);
    } else {
      updatedComponent = {
        ...updatedComponent,
        supersets: newSupersets,
      };

      const updatedComponents = training.components.map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      const newTraining = {
        ...training,
        components: updatedComponents,
      };

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setTraining(newTraining);
    }
  });
}

export const getPerscribedFieldName = (
  param: Attribute,
  leftOrRight: 'L' | 'R'
): keyof Workload => {
  let perscribedFieldName;
  switch (param.field) {
    case 'int1':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntWork1ValueL'
          : 'prescribedIntWork1ValueR';
      break;
    case 'int2':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntWork2ValueL'
          : 'prescribedIntWork2ValueR';
      break;
    case 'vol1':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolWork1ValueL'
          : 'prescribedVolWork1ValueR';
      break;
    case 'vol2':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolWork2ValueL'
          : 'prescribedVolWork2ValueR';
      break;
    case 'intRec':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntRecValueL'
          : 'prescribedIntRecValueR';
      break;
    case 'volRec':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolRecValueL'
          : 'prescribedVolRecValueR';
      break;
    default:
      break;
  }

  return perscribedFieldName as keyof Workload;
};

export const getLAndRValues = (
  input: {
    set: ExerciseSet;
    param: Attribute;
    setIndex: number;
    paramIndex: number;
  },
  state: {
    training: Training;
    exercise: TrainingExercise;
    selectedAthleteWorkloads: CompletedFutureWorkloads;
    customAthleteWorkloads: Workload[];
    selectedAthlete?: User;
  }
): {
  valueL: AttributeValue | null;
  valueR: AttributeValue | null;
} => {
  const { set, param, setIndex, paramIndex } = input;
  const {
    training,
    exercise,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    selectedAthlete,
  } = state;

  let valueL: AttributeValue | null = null;
  let valueR: AttributeValue | null = null;

  // find the custom workload for the selected athlete in the current session
  const foundCustomFutureWorkload = customAthleteWorkloads.find(
    (cw) =>
      cw.trainingId === training.id &&
      cw.exerciseId === exercise.id &&
      cw.setNumber === set.setNumber &&
      cw.userId === selectedAthlete?.uid
  );

  // find the fetched future custom workload for the selected athlete
  const foundFutureWorkload = selectedAthleteWorkloads.futureWorkloads.find(
    (fw) =>
      fw.trainingId === training.id &&
      fw.exerciseId === exercise.id &&
      fw.setNumber === set.setNumber &&
      fw.userId === selectedAthlete?.uid
  );

  if (
    (foundCustomFutureWorkload || foundFutureWorkload) &&
    param.field !== ParamType.VolWorkSets
  ) {
    const perscribedFieldNameL = getPerscribedFieldName(param, 'L');
    const perscribedFieldNameR = getPerscribedFieldName(param, 'R');

    if (!perscribedFieldNameL || !perscribedFieldNameR) {
      toast.error(`Invalid parameter field: ${param.field}`);
      return { valueL: null, valueR: null };
    }

    const selectedL = exercise.sets[setIndex].paramValuesL[paramIndex].selected;
    const selectedR =
      exercise.sets[setIndex].paramValuesR?.[paramIndex].selected;

    valueL = {
      field: param.field,
      selected: selectedL,
      value:
        (foundCustomFutureWorkload || foundFutureWorkload)?.[
          perscribedFieldNameL
        ]?.toString() ||
        exercise.sets[setIndex].paramValuesL.find(
          (pv) => pv.field === param.field
        )?.value ||
        '',
    };

    valueR = selectedR
      ? {
          field: param.field,
          selected: selectedR,
          value:
            (foundCustomFutureWorkload || foundFutureWorkload)?.[
              perscribedFieldNameR
            ]?.toString() ||
            exercise.sets[setIndex].paramValuesR?.find(
              (pv) => pv.field === param.field
            )?.value ||
            '',
        }
      : null;
  } else {
    valueL = exercise.sets[setIndex].paramValuesL.find(
      (pv) => pv.field === param.field
    ) || {
      field: param.field,
      selected: 'set',
      value: exercise.sets.length.toString(),
    };

    valueR = exercise.sets[setIndex].paramValuesR?.find(
      (pv) => pv.field === param.field
    ) || {
      field: param.field,
      selected: 'set',
      value: exercise.sets.length.toString(),
    };
  }

  return { valueL, valueR };
};
