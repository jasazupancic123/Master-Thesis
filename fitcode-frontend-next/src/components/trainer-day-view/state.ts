import type { DraggableLocation, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import { DEFAULT_SUBGROUP_ID, NUM_MAX_SUPERSETS } from './constant';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/common/constant/add-superset-droppable-id.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { VolType } from '@/controller/component/enum/param.enum';
import { IntType } from '@/controller/component/enum/param.enum';
import { ParamType } from '@/controller/component/enum/param.enum';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { WorkloadValue } from '@/controller/training/type/workload-value.type';

export function handleDeleteSubgroup(
  input: { subgroupId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedExercises: TrainingExercise[];
    setSelectedExercises: SetState<TrainingExercise[]>;
    setTrainings: SetState<Training[]>;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { subgroupId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedExercises,
    setSelectedExercises,
    setTrainings,
    setSelectedSubgroup,
    setDetectedChanges,
  } = state;
  if (!training || !component) return;

  setDetectedChanges(true);

  const subgroupsCopy = [...component.subgroups];
  const deletingSubgroup = subgroupsCopy.find((sg) => sg.id === subgroupId);

  let updatedSubgroups = subgroupsCopy.filter(
    (subgroup) => subgroup.id !== subgroupId
  );

  if (deletingSubgroup) {
    deletingSubgroup.membersIds.forEach((memberId) => {
      const foundCustomUserSubgroup = component.subgroups.find(
        (subgroup) =>
          subgroup.parentId && subgroup.membersIds.includes(memberId)
      );

      if (!foundCustomUserSubgroup) return;

      updatedSubgroups = updatedSubgroups.filter(
        (sg) => sg.id !== foundCustomUserSubgroup?.id
      );
    });
  }

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setComponent(newComponent);

  const updatedComponents = [...training.components].map((c) =>
    c.id === component.id ? newComponent : c
  );

  const newTraining: Training =
    newComponent.id === WARMUP_ID
      ? { ...training, warmup: newComponent }
      : newComponent.id === COOLDOWN_ID
        ? { ...training, cooldown: newComponent }
        : {
            ...training,
            components: updatedComponents,
          };

  setTraining(newTraining);
  setTrainings((prev) =>
    prev.map((t) => (t.id === training.id ? newTraining : t))
  );

  setSelectedSubgroup(null);
  setSelectedExercises(
    component?.supersets
      .flatMap((s) => s.exercises)
      .filter((e) => selectedExercises.some((se) => se.id === e.id)) || []
  );
}

export const onAddExerciseDrop = (
  supersets: Superset[],
  draggableId: string
): Superset[] | undefined => {
  if (supersets.length >= NUM_MAX_SUPERSETS) {
    toast.error(
      `You can only have ${NUM_MAX_SUPERSETS} supersets per component`
    );
    return;
  }

  const supersetsCopy = [...supersets];
  const supersetWithExercise = supersetsCopy.find((s) =>
    s.exercises.find((e) => e.id === draggableId)
  );

  if (!supersetWithExercise) return;
  const draggedExercise = supersetWithExercise?.exercises.find(
    (e) => e.id === draggableId
  );

  if (!draggedExercise) return;

  const newSupersets = [...supersetsCopy, { exercises: [draggedExercise] }];
  supersetWithExercise.exercises = supersetWithExercise.exercises.filter(
    (e) => e.id !== draggableId
  );

  return newSupersets.filter((s) => s.exercises.length > 0);
};

export const onDragEndExerciseToExistingSuperset = (
  input: {
    draggableId: string;
    destination: DraggableLocation;
  },
  state: {
    component: TrainingComponent;
    selectedSubgroup: Subgroup | null;
    supersets: Superset[];
  }
): Superset[] | undefined => {
  const { destination, draggableId } = input;
  const { component, selectedSubgroup, supersets } = state;

  const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
  const supersetWithNewExercise = supersets[supersetIndex];
  const supersetsCopy = [...supersets];
  const supersetWithExercise = supersetsCopy.find((superset) =>
    superset.exercises.find((e) => e.id === draggableId)
  );

  if (!supersetWithExercise) return;

  // onDragEnd inside the same superset
  if (supersetWithExercise === supersetWithNewExercise) {
    // Get y coordinates of all exercises in the superset
    const sortedExercises =
      (selectedSubgroup || component).mainSet === MainSet.BLOCK
        ? supersetWithExercise.exercises
            .map((e) => ({
              exercise: e,
              y:
                document.getElementById(e.id)?.getBoundingClientRect().top ??
                Infinity, // Default to Infinity if not found
            }))
            .sort((a, b) => a.y - b.y) // Sort by y coordinate
            .map((item) => item.exercise) // Extract only exercises
        : supersetWithExercise.exercises
            .map((e) => {
              const rect = document
                .getElementById(e.id)
                ?.getBoundingClientRect();
              const top = rect?.top ?? Infinity;
              const left = rect?.left ?? Infinity;
              const height = rect?.height ?? 0;
              const yCenter = isFinite(top) ? top + height / 2 : Infinity;
              return { exercise: e, top, left, height, yCenter };
            })
            .sort((a, b) => {
              // Treat items as same row if their vertical centers are close
              const tol = Math.min(a.height, b.height) * 0.5; // adjust 0.4–0.7 if needed
              if (Math.abs(a.yCenter - b.yCenter) > tol) {
                return a.yCenter - b.yCenter; // different rows → sort by Y
              }
              return a.left - b.left; // same row    → sort by X
            })
            .map((i) => i.exercise);

    const newSuperset = {
      ...supersetWithExercise,
      exercises: sortedExercises,
    };

    return supersetsCopy.map((superset) =>
      superset === supersetWithExercise ? newSuperset : superset
    );
  }

  // onDragEnd exercise to another existing superset
  if (supersetWithNewExercise.exercises.length >= NUM_MAX_SUPERSETS) {
    toast.error(
      `You can only have ${NUM_MAX_SUPERSETS} exercises per superset`
    );
    return;
  }

  const exerciseIndex = supersetWithExercise.exercises.findIndex(
    (e) => e.id === draggableId
  );

  // ČORI TU MORE BIT UNDEFINED KER !exerciseIndex se kliče tudi te ko je 0!
  if (exerciseIndex === undefined || exerciseIndex === -1) return;

  const exercise = supersetWithExercise.exercises[exerciseIndex];
  supersetWithNewExercise.exercises.push(exercise);

  const newExercises = supersetWithNewExercise.exercises;
  const sortedExercises = newExercises
    .map((e) => ({
      exercise: e,
      y: document.getElementById(e.id)?.getBoundingClientRect().top ?? Infinity, // Default to Infinity if not found
    }))
    .sort((a, b) => a.y - b.y) // Sort by y coordinate
    .map((item) => item.exercise); // Extract only exercises

  supersetWithNewExercise.exercises = sortedExercises;
  const oldFinalSupersetExercises = supersetWithExercise.exercises.filter(
    (e) => e.id !== draggableId
  );

  let finalSupersetsCopy;

  if (oldFinalSupersetExercises.length > 0) {
    finalSupersetsCopy = supersetsCopy.map((superset) =>
      superset === supersetWithExercise
        ? { ...superset, exercises: oldFinalSupersetExercises }
        : superset
    );
  } else {
    finalSupersetsCopy = supersetsCopy.filter(
      (superset) => superset !== supersetWithExercise
    );
  }

  return finalSupersetsCopy;
};

export async function onDragEndExercise(
  input: {
    draggableId: string;
    destination: DraggableLocation | null | undefined;
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    supersets: Superset[];
    setSupersets: SetState<Superset[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { destination, draggableId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    supersets,
    setSupersets,
    setDetectedChanges,
  } = state;

  if (!destination || !training || !component) return;

  // if it's custom workloads subgroup, then dissable
  if (selectedSubgroup?.parentId) return;

  if (destination.droppableId === ADD_SUPERSET_DROPPABLE_ID) {
    const newSupersets = onAddExerciseDrop(supersets, draggableId);

    if (!newSupersets) return;

    setDetectedChanges(true);

    setSupersets([...newSupersets]);

    if (selectedSubgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: newSupersets,
      };
      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      };

      updatedComponent.subgroups =
        CustomWorkloadsSubgroupsService.updateOnAddExerciseDrop(
          selectedSubgroup,
          updatedComponent,
          draggableId
        );

      setSelectedSubgroup(updatedSubgroup);
      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );
    } else {
      const updatedComponent = {
        ...component,
        supersets: newSupersets,
      };

      updatedComponent.subgroups =
        CustomWorkloadsSubgroupsService.updateOnAddExerciseDrop(
          selectedSubgroup,
          component,
          draggableId
        );

      setDetectedChanges(true);

      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );
    }

    return;
  }

  const updatedSupersets = onDragEndExerciseToExistingSuperset(
    {
      draggableId,
      destination,
    },
    {
      component,
      selectedSubgroup,
      supersets,
    }
  );

  if (!updatedSupersets) return;

  setSupersets(updatedSupersets);

  if (selectedSubgroup) {
    const updatedSubgroup: Subgroup = {
      ...selectedSubgroup,
      supersets: updatedSupersets,
    };

    const updatedComponent: TrainingComponent = {
      ...component,
      subgroups: component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    };

    updatedComponent.subgroups =
      CustomWorkloadsSubgroupsService.updateOnDragEndExerciseToExistingSuperset(
        draggableId,
        destination,
        updatedComponent,
        updatedSubgroup
      );

    setSelectedSubgroup(updatedSubgroup);

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  } else {
    const updatedComponent: TrainingComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    updatedComponent.subgroups =
      CustomWorkloadsSubgroupsService.updateOnDragEndExerciseToExistingSuperset(
        draggableId,
        destination,
        updatedComponent,
        null
      );

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  }

  setDetectedChanges(true);
}

export function updateGlobalStates(
  training: Training,
  component: TrainingComponent,
  updatedComponent: TrainingComponent,
  setTraining: SetState<Training | undefined>,
  warmupOrCooldown: boolean
) {
  if (warmupOrCooldown) {
    const newTraining = { ...training };
    if (component.id === WARMUP_ID) newTraining.warmup = updatedComponent;
    else newTraining.cooldown = updatedComponent;

    setTraining(newTraining);
  } else {
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);
  }
}

export function prepareGroupAvgWorkloadsForChart(
  trainings: Training[],
  training: Training,
  componentId: string,
  exercise: TrainingExercise,
  selectedParams: ParamType[],
  setData: SetState<ChartWorkloadData[]>,
  setMax: SetState<number>,
  setRange: SetState<number[]>
) {
  const newData: ChartWorkloadData[] = [];

  trainings.forEach((t) => {
    if (t.id === training.id) t = training;

    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
      componentId: componentId,
      exerciseId: exercise.id,
      name,
      plannedAt: t.from,
    };

    const workloads: Workload[] = [];

    const component = t.components.find((c) => c.id === componentId);
    if (!component) return;

    const foundExercises: {
      exercise: TrainingExercise;
      membersIds: string[];
    }[] = [];

    // prioritize selected subgroup supersets, if its the custom workload subgroup (with parentId)
    const supersets = component.supersets;

    const foundExerciseInComponent = supersets
      .flatMap((s) => s.exercises)
      .find((e) => e.id === exercise.id);

    const membersIdsInMainComponent = t.membersIds.filter(
      (id) => !component.subgroups.flatMap((s) => s.membersIds).includes(id)
    );

    if (foundExerciseInComponent)
      foundExercises.push({
        exercise: foundExerciseInComponent,
        membersIds: membersIdsInMainComponent,
      });

    // if not a custom workload subgroup is selected,
    // then also take avgs of all subgroups to make up for the whole group avg
    component.subgroups.forEach((sg) => {
      const foundSubgroupExercis = sg.supersets
        .flatMap((s) => s.exercises)
        .find((e) => e.id === exercise.id);

      if (foundSubgroupExercis)
        foundExercises.push({
          exercise: foundSubgroupExercis,
          membersIds: sg.membersIds,
        });
    });

    if (!foundExercises.length) return;

    foundExercises.forEach((foundExercise) => {
      foundExercise.exercise.sets.forEach((set) => {
        // check if data is in the array already for the current set
        for (const memberId of foundExercise.membersIds) {
          if (
            workloads.some(
              (w) =>
                w.setNumber === set.setNumber &&
                w.exerciseId === foundExercise.exercise.id &&
                w.componentId === componentId &&
                w.trainingId === t.id &&
                w.userId === memberId
            )
          )
            return;

          const workload: Workload = {
            trainingId: t.id,
            componentId: componentId,
            exerciseId: foundExercise.exercise.id,
            setNumber: set.setNumber,
            plannedAt: t.from,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: memberId,
            supersetIndex: 0,
            status: SetStatus.NOT_STARTED,
            intWork1Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.IntWork1
            )?.selected as IntType,
            intWork2Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.IntWork2
            )?.selected as IntType,
            volWork1Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.VolWork1
            )?.selected as VolType,
            volWork2Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.VolWork2
            )?.selected as VolType,
          };

          for (const paramValue of set.paramValuesL) {
            const fieldName = getWorkloadFieldName(paramValue, true);

            if (!fieldName) continue;

            workload[fieldName] = Number(paramValue.value);
          }

          workloads.push(workload);
        }
      });
    });

    const workloadData = prepareWorkloadsForData(
      workloads,
      exercise,
      selectedParams,
      t.id,
      chartWorkloadData
    );
    newData.push(workloadData);
  });

  // sort by plannedAt
  newData.sort((a, b) => {
    const dateA = new Date(a.plannedAt);
    const dateB = new Date(b.plannedAt);
    return dateA.getTime() - dateB.getTime();
  });

  setData(newData);
  setMax(newData.length);
  setRange([1, newData.length]);
}

function getFormatedName(plannedAt: Date) {
  const date = new Date(plannedAt);

  const day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (month[0] === '0') month = month.slice(1);

  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Final format: "DD MM, AM/PM"
  const formatted = `${day}.${month}. ${ampm}`;

  return formatted;
}

function getWorkloadFieldName(paramValue: AttributeValue, completed: boolean) {
  let fieldName:
    | keyof Pick<
        WorkloadValue,
        | 'intWork1ValueL'
        | 'prescribedIntWork1ValueL'
        | 'intWork2ValueL'
        | 'prescribedIntWork2ValueL'
        | 'volWork1ValueL'
        | 'prescribedVolWork1ValueL'
        | 'volWork2ValueL'
        | 'prescribedVolWork2ValueL'
      >
    | undefined = undefined;

  switch (paramValue.field) {
    case ParamType.IntWork1:
      fieldName = completed ? 'intWork1ValueL' : 'prescribedIntWork1ValueL';
      break;
    case ParamType.IntWork2:
      fieldName = completed ? 'intWork2ValueL' : 'prescribedIntWork2ValueL';
      break;
    case ParamType.VolWork1:
      fieldName = completed ? 'volWork1ValueL' : 'prescribedVolWork1ValueL';
      break;
    case ParamType.VolWork2:
      fieldName = completed ? 'volWork2ValueL' : 'prescribedVolWork2ValueL';
      break;
  }

  return fieldName;
}

function getWorkloadFields(paramValue: AttributeValue) {
  let workloadFields:
    | (keyof Pick<
        WorkloadValue,
        | 'intWork1ValueL'
        | 'prescribedIntWork1ValueL'
        | 'intWork2ValueL'
        | 'prescribedIntWork2ValueL'
        | 'volWork1ValueL'
        | 'prescribedVolWork1ValueL'
        | 'volWork2ValueL'
        | 'prescribedVolWork2ValueL'
      >)[]
    | undefined = undefined;

  switch (paramValue.field) {
    case ParamType.IntWork1:
      workloadFields = ['intWork1ValueL', 'prescribedIntWork1ValueL'];
      break;
    case ParamType.IntWork2:
      workloadFields = ['intWork2ValueL', 'prescribedIntWork2ValueL'];
      break;
    case ParamType.VolWork1:
      workloadFields = ['volWork1ValueL', 'prescribedVolWork1ValueL'];
      break;
    case ParamType.VolWork2:
      workloadFields = ['volWork2ValueL', 'prescribedVolWork2ValueL'];
      break;
    default:
      break;
  }

  return workloadFields;
}

function prepareWorkloadsForSingleParam(
  workloads: Workload[],
  selectedParam: Attribute,
  paramFields: (keyof Pick<
    WorkloadValue,
    | 'intWork1ValueL'
    | 'prescribedIntWork1ValueL'
    | 'intWork2ValueL'
    | 'prescribedIntWork2ValueL'
    | 'volWork1ValueL'
    | 'prescribedVolWork1ValueL'
    | 'volWork2ValueL'
    | 'prescribedVolWork2ValueL'
  >)[]
) {
  if (
    (selectedParam.type &&
      ![AttributeType.Number, AttributeType.Select].includes(
        selectedParam.type
      )) ||
    !paramFields.length
  )
    return;

  const validValues = workloads
    .map((w) => w[paramFields[0]] || w[paramFields[1]])
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  if (!validValues.length) return;

  let avgValue: number | undefined = undefined;
  let fullValue: string | undefined = undefined;

  const paramName =
    selectedParam.name[0].toUpperCase() +
    selectedParam.name.slice(1).toLowerCase();
  if (selectedParam.type === AttributeType.Number) {
    // get the avg number
    avgValue =
      validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
    fullValue = `${paramName}: ${Math.round(avgValue * 100) / 100}`;
  } else if (selectedParam.type === AttributeType.Select) {
    // get the most represented value/index (as number)
    const valueCounts = new Map<number, number>();

    validValues.forEach((val) => {
      valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
    });

    const [mostCommonValue] = Array.from(valueCounts.entries()).reduce(
      (acc, [val, count]) => (count > acc[1] ? [val, count] : acc),
      [0, 0] as [number, number]
    );

    avgValue = mostCommonValue;
    const valueName = selectedParam.options?.find(
      (o) => o.field === mostCommonValue.toString()
    )?.name;
    fullValue = `${paramName}: ${valueName}`;
  }

  if (avgValue === undefined) return;

  return {
    avgValue: Math.round(avgValue * 100) / 100,
    fullValue,
  };
}

function prepareWorkloadsForData(
  workloads: Workload[],
  exercise: TrainingExercise,
  selectedParams: ParamType[],
  trainingId: string,
  chartWorkloadData: ChartWorkloadData // has got trainingId, name, plannedAt, completed
): ChartWorkloadData {
  for (const param of exercise.params) {
    if (!selectedParams.includes(param.field as ParamType)) continue;

    // example: int1 param
    const paramValue = exercise.sets[0].paramValuesL.find(
      (p) => p.field === param.field
    );
    if (!paramValue) continue;

    if (paramValue.selected === IntType.Tempo) continue;

    let field:
      | keyof Pick<
          WorkloadValue,
          'intWork1Type' | 'intWork2Type' | 'volWork1Type' | 'volWork2Type'
        >
      | undefined = undefined;
    if (param.field === ParamType.IntWork1) field = 'intWork1Type';
    else if (param.field === ParamType.IntWork2) field = 'intWork2Type';
    else if (param.field === ParamType.VolWork1) field = 'volWork1Type';
    else if (param.field === ParamType.VolWork2) field = 'volWork2Type';

    const foundWorkload = workloads.find((w) => w.trainingId === trainingId);

    if (!field || !foundWorkload) continue;

    // should return for example the whole eff/tempo param
    const selectedParam = param.options?.find(
      (o) => o.field === foundWorkload[field]
    );
    if (!selectedParam) continue;

    const workloadFields = getWorkloadFields(paramValue);
    if (!workloadFields) continue;

    const preparedWorkloads = prepareWorkloadsForSingleParam(
      workloads,
      selectedParam,
      workloadFields
    );

    if (!preparedWorkloads) continue;

    const { avgValue, fullValue } = preparedWorkloads;

    switch (paramValue.field) {
      case ParamType.IntWork1:
        chartWorkloadData.int1 = Math.round(avgValue * 100) / 100;
        chartWorkloadData.int1FullValue = fullValue;
        break;
      case ParamType.IntWork2:
        chartWorkloadData.int2 = avgValue;
        chartWorkloadData.int2FullValue = fullValue;
        break;
      case ParamType.VolWork1:
        chartWorkloadData.vol1 = avgValue;
        chartWorkloadData.vol1FullValue = fullValue;
        break;
      case ParamType.VolWork2:
        chartWorkloadData.vol2 = avgValue;
        chartWorkloadData.vol2FullValue = fullValue;
        break;
      default:
        break;
    }
  }

  return chartWorkloadData;
}

export function prepareSelectedAthleteAvgWorkloadsForChart(input: {
  selectedAthleteWorkloads: Workload[]; // fetched
  training: Training;
  component: TrainingComponent;
  trainings: Training[];
  exercise: TrainingExercise;
  selectedAthlete: AuthUser;
  selectedSubgroup: Subgroup | null;
  selectedParams: ParamType[];
  setData: SetState<ChartWorkloadData[]>;
  setMax: SetState<number>;
  setRange: SetState<number[]>;
}) {
  const {
    selectedAthleteWorkloads,
    training,
    component,
    trainings,
    exercise,
    selectedAthlete,
    selectedSubgroup,
    selectedParams,
    setData,
    setMax,
    setRange,
  } = input;

  const newData: ChartWorkloadData[] = [];

  trainings.forEach((t) => {
    if (!t.membersIds.includes(selectedAthlete.uid)) return;

    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
      componentId: component.id,
      exerciseId: exercise.id,
      name,
      plannedAt: t.from,
    };

    const workloads: Workload[] = [];

    const isCustomWorkloadSubgroup =
      selectedSubgroup?.parentId &&
      selectedSubgroup.membersIds.includes(selectedAthlete.uid);

    if (t.id === training.id && isCustomWorkloadSubgroup) {
      // if its the current training, take the selectedSubgroup which is used
      // for custom athlete workloads
      selectedSubgroup.supersets.forEach((superset, i) => {
        superset.exercises.forEach((e) => {
          if (e.id !== exercise.id) return;

          e.sets.forEach((set) => {
            const workload: Workload = {
              groupId: training.groupId,
              cycleId: training.cycleId,
              userId: selectedAthlete.uid,
              trainingId: training.id,
              componentId: component.id,
              exerciseId: e.id,
              setNumber: set.setNumber,
              supersetIndex: i,
              status: SetStatus.NOT_STARTED,
              intWork1Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.IntWork1
              )?.selected as IntType,
              intWork2Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.IntWork2
              )?.selected as IntType,
              volWork1Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.VolWork1
              )?.selected as VolType,
              volWork2Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.VolWork2
              )?.selected as VolType,
              plannedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            for (const paramValue of set.paramValuesL) {
              const fieldName = getWorkloadFieldName(paramValue, true);

              if (!fieldName) continue;

              workload[fieldName] = Number(paramValue.value);
            }

            workloads.push(workload);
          });
        });
      });

      const workloadData = prepareWorkloadsForData(
        workloads,
        exercise,
        selectedParams,
        t.id,
        chartWorkloadData
      );

      newData.push(workloadData);

      return;
    }

    // first check in selectedAthleteWorkloads, which are set in the current session
    // completedWorkloads

    const foundCompletedSelectedAthleteWorkloads =
      selectedAthleteWorkloads.filter(
        (w) =>
          w.exerciseId === exercise.id &&
          w.componentId === component.id &&
          w.trainingId === t.id
      );

    if (foundCompletedSelectedAthleteWorkloads.length)
      workloads.push(...foundCompletedSelectedAthleteWorkloads);

    // third check in main group or subgroup of the training

    const trainingComponent = t.components.find((c) => c.id === component.id);

    if (!trainingComponent) return;

    const subgroups = trainingComponent.subgroups.filter((s) =>
      s.membersIds.includes(selectedAthlete.uid)
    );

    let subgroup = undefined;

    if (subgroups.length) {
      const parentIdSubgroup = subgroups.find((s) => s.parentId);
      if (parentIdSubgroup) subgroup = parentIdSubgroup;
      else subgroup = subgroups[0];
    }

    const foundExercise: TrainingExercise | undefined = subgroup
      ? subgroup.supersets
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id)
      : trainingComponent.supersets
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id);

    if (!foundExercise) return;

    foundExercise.sets.forEach((set) => {
      // check if data is in the array already for the current set
      if (
        workloads.some(
          (w) =>
            w.setNumber === set.setNumber &&
            w.exerciseId === foundExercise.id &&
            w.componentId === component.id &&
            w.trainingId === t.id
        )
      )
        return;

      const workload: Workload = {
        trainingId: t.id,
        componentId: component.id,
        exerciseId: foundExercise.id,
        setNumber: set.setNumber,
        plannedAt: t.from,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: selectedAthlete.uid,
        supersetIndex: 0,
        status: SetStatus.NOT_STARTED,
        intWork1Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.IntWork1
        )?.selected as IntType,
        intWork2Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.IntWork2
        )?.selected as IntType,
        volWork1Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.VolWork1
        )?.selected as VolType,
        volWork2Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.VolWork2
        )?.selected as VolType,
      };

      for (const paramValue of set.paramValuesL) {
        const fieldName = getWorkloadFieldName(paramValue, true);

        if (!fieldName) continue;

        workload[fieldName] = Number(paramValue.value);
      }

      workloads.push(workload);
    });

    const workloadData = prepareWorkloadsForData(
      workloads,
      exercise,
      selectedParams,
      t.id,
      chartWorkloadData
    );
    newData.push(workloadData);
  });

  // sort by plannedAt
  newData.sort((a, b) => {
    const dateA = new Date(a.plannedAt);
    const dateB = new Date(b.plannedAt);
    return dateA.getTime() - dateB.getTime();
  });

  setData(newData);
  setMax(newData.length);
  setRange([1, newData.length]);
}
