import {
  ExerciseSet,
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import ReactDOM from 'react-dom';
import { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import { Training } from '@/controller/training/type/training.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { User } from '@/controller/user/type/user.type';
import { Workload } from '@/controller/training/type/workload.type';
import toast from 'react-hot-toast';
import { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';

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
    // the first set has been updated on non expanded view, update all sets
    let foundFutureWorkloads = selectedAthleteWorkloads.futureWorkloads.filter(
      (fw) =>
        fw.trainingId === training.id &&
        fw.exerciseId === exercise.id &&
        fw.userId === selectedAthlete.uid
    );

    if (!foundFutureWorkloads.length) {
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
    exercise: TrainingExercise;
    intensityVolumeValue?: IntensityVolumeValues;
  },
  state: {
    training: Training;
    component: TrainingComponent | null;
    setTodaysTrainings: SetState<Training[]>;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: {
      subgroup: Subgroup | null;
      index: number;
    } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
    supersetIndex: number;
  }
) {
  const { exercise, intensityVolumeValue } = input;
  const {
    training,
    component,
    setTodaysTrainings,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    supersetIndex,
    setSelectedSubgroup,
  } = state;

  if (!training || !component) return;

  const newSuperset = { ...supersets[supersetIndex] };
  const exerciseIndex = newSuperset.exercises.findIndex(
    (e) => e.id === exercise.id
  );

  if (exerciseIndex === -1 || !training || !component) return;

  newSuperset.exercises[exerciseIndex] = { ...exercise };
  const newSupersets = [...supersets];
  if (supersetIndex !== -1) newSupersets[supersetIndex] = newSuperset;

  ReactDOM.unstable_batchedUpdates(() => {
    setDetectedChanges(true);

    if (selectedSubgroup?.subgroup) {
      // set new avg future workload values
      let newAvgFutureWorkloadValues = undefined;
      if (intensityVolumeValue) {
        newAvgFutureWorkloadValues = [
          ...selectedSubgroup.subgroup.avgFutureWorkloadValues,
        ];
        const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
          (aw) => aw.exerciseId === exercise.id
        );
        if (!foundAvgWorkloadValue) {
          newAvgFutureWorkloadValues.push({
            exerciseId: exercise.id,
            rootComponentId: component.component?.id || '',
            numMembers: selectedSubgroup.subgroup.membersIds.length,
            avgWorkloadValue: intensityVolumeValue!,
          });
        } else {
          foundAvgWorkloadValue.numMembers =
            selectedSubgroup.subgroup.membersIds.length;
          foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
        }
      }

      const updatedSubgroup = newAvgFutureWorkloadValues
        ? {
            ...selectedSubgroup.subgroup,
            supersets: newSupersets,
            avgFutureWorkloadValues: newAvgFutureWorkloadValues,
          }
        : {
            ...selectedSubgroup.subgroup,
            supersets: newSupersets,
          };

      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s, i) =>
          i === selectedSubgroup.index ? updatedSubgroup : s
        ),
      };
      setSelectedSubgroup({
        subgroup: updatedSubgroup,
        index: selectedSubgroup.index,
      });

      const updatedComponents = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };

      setTodaysTrainings((prev) =>
        prev.map((t) => {
          if (t.id !== newTraining.id) return newTraining;
          return t;
        })
      );
    } else {
      const updatedComponent = {
        ...component,
        supersets: newSupersets,
      };

      const updatedComponents = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      // set new avg future workload values
      let newAvgFutureWorkloadValues = undefined;
      if (intensityVolumeValue) {
        newAvgFutureWorkloadValues = [...training.avgFutureWorkloadValues];
        const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
          (aw) => aw.exerciseId === exercise.id
        );

        // get number of members in main group
        const subgroupsMembersIds = updatedComponent.subgroups.reduce(
          (acc, subgroup) => {
            return [...acc, ...subgroup.membersIds];
          },
          [] as string[]
        );
        const numberOfMainGroupMembers =
          training.membersIds.length - subgroupsMembersIds.length;

        if (!foundAvgWorkloadValue) {
          newAvgFutureWorkloadValues.push({
            exerciseId: exercise.id,
            rootComponentId: component.component?.id || '',
            numMembers: numberOfMainGroupMembers,
            avgWorkloadValue: intensityVolumeValue!,
          });
        } else {
          foundAvgWorkloadValue.numMembers = numberOfMainGroupMembers;
          foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
        }
      }

      const newTraining = newAvgFutureWorkloadValues
        ? {
            ...training,
            components: updatedComponents,
            avgFutureWorkloadValues: newAvgFutureWorkloadValues,
          }
        : { ...training, components: updatedComponents };

      setTodaysTrainings((prev) =>
        prev.map((t) => {
          if (t.id === newTraining.id) return newTraining;
          return t;
        })
      );
    }
  });
}

export const getPerscribedFieldName = (
  param: Attribute,
  leftOrRight: 'L' | 'R'
) => {
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

  return perscribedFieldName;
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
) => {
  const { set, param, setIndex, paramIndex } = input;
  const {
    training,
    exercise,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    selectedAthlete,
  } = state;

  let valueL, valueR;

  // find the custom workload for the selected athlete
  const foundCustomFutureWorkload = customAthleteWorkloads.find(
    (cw) =>
      cw.trainingId === training.id &&
      cw.exerciseId === exercise.id &&
      cw.setNumber === set.setNumber &&
      cw.userId === selectedAthlete?.uid
  );
  //  ||
  // customAthleteWorkloads.find(
  //   (cw) =>
  //     cw.trainingId === training.id &&
  //     cw.exerciseId === exercise.id &&
  //     cw.setNumber === set.setNumber &&
  //     cw.userId === previousSelectedAthlete.current?.uid
  // );

  // find the future workload for the selected athlete, not yet custom/modified
  const foundFutureWorkload = selectedAthleteWorkloads.futureWorkloads.find(
    (fw) =>
      fw.trainingId === training.id &&
      fw.exerciseId === exercise.id &&
      fw.setNumber === set.setNumber &&
      fw.userId === selectedAthlete?.uid
  );
  //  ||
  // selectedAthleteWorkloads.futureWorkloads.find(
  //   (fw) =>
  //     fw.trainingId === training.id &&
  //     fw.exerciseId === exercise.id &&
  //     fw.setNumber === set.setNumber &&
  //     fw.userId === previousSelectedAthlete.current?.uid
  // );

  if (
    (foundCustomFutureWorkload || foundFutureWorkload) &&
    param.field !== 'volWorkSets'
  ) {
    const perscribedFieldNameL = getPerscribedFieldName(param, 'L');
    const perscribedFieldNameR = getPerscribedFieldName(param, 'R');

    if (!perscribedFieldNameL || !perscribedFieldNameR) {
      toast.error(`Invalid parameter field: ${param.field}`);
      return { valueL: null, valueR: null };
    }

    const selected = exercise.sets[setIndex].paramValuesL[paramIndex].selected;

    valueL = {
      field: param.field,
      selected: selected,
      value: ((foundCustomFutureWorkload || foundFutureWorkload) as any)[
        perscribedFieldNameL
      ].toString(),
    };

    valueR = {
      field: param.field,
      selected: selected,
      value: ((foundCustomFutureWorkload || foundFutureWorkload) as any)[
        perscribedFieldNameR
      ].toString(),
    };
  } else {
    valueL = exercise.sets[setIndex].paramValuesL.find(
      (pv) => pv.field === param.field
    ) || {
      field: param.field,
      selected: 'set',
      value: exercise.sets.length.toString(),
    };

    valueR = exercise.sets[setIndex].paramValuesR.find(
      (pv) => pv.field === param.field
    ) || {
      field: param.field,
      selected: 'set',
      value: exercise.sets.length.toString(),
    };
  }

  return { valueL, valueR };
};
