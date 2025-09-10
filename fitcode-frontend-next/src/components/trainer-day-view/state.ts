import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { DraggableLocation, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import { DEFAULT_SUBGROUP_ID, NUM_MAX_SUPERSETS } from './constant';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/common/constant/add-superset-droppable-id.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { CommonService } from '@/common/service/common.service';
import type { Day } from '@/common/service/util/date.util';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { IntType, VolType } from '@/controller/component/enum/param.enum';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Method } from '@/controller/method/type/method.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import type { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { WorkloadValue } from '@/controller/training/type/workload-value.type';
import type { User } from '@/controller/user/type/user.type';

export async function handleCopyTraining(
  controller: TrainingController,
  input: {
    newDate: Dayjs;
    period: string;
  },
  state: {
    router: AppRouterInstance;
    training: Training;
    cycle: Cycle;
    day: Day;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
  }
) {
  const { newDate, period } = input;
  const {
    router,
    training,
    cycle,
    setTrainings,
    components,
    exercises,
    methods,
  } = state;

  if (
    !CommonService.instance.date.isBetween(
      newDate,
      dayjs(cycle.from),
      dayjs(cycle.to)
    )
  )
    return toast.error('Selected date is not within the cycle');

  const amPair = { start: 8, end: 10 };
  const pmPair = { start: 14, end: 16 };
  const pair = period === 'AM' ? amPair : pmPair;

  // set start time and end time to date
  const from = newDate
    .set('year', newDate.year())
    .set('month', newDate.month())
    .set('date', newDate.date())
    .set('hour', pair.start)
    .set('minute', 0)
    .set('second', 0)
    .toString();

  handleApiRequest(
    router,
    () => controller.copy(training.id, { from: new Date(from) }),
    (copiedTraining) => {
      TrainingService.mapData(copiedTraining, {
        components,
        exercises,
        methods,
      });

      setTrainings((prev) =>
        [...prev, copiedTraining].sort(
          (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
        )
      );

      toast.success('Successfully copied training');
    },
    undefined,
    'Failed to copy'
  );
}

export function onDragEndSubgroup(
  { destination, draggableId }: DropResult,
  state: {
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    changedSubgroupIds: string[];
    setChangedSubgroupIds: SetState<string[]>;
    users: User[];
    component: TrainingComponent | undefined;
    setComponent: SetStateNullable<TrainingComponent>;
    training: Training | undefined;
    setTraining: SetStateNullable<Training>;
  }
) {
  const {
    subgroups,
    setSubgroups,
    changedSubgroupIds,
    setChangedSubgroupIds,
    users,
    component,
    setComponent,
    training,
    setTraining,
  } = state;

  if (!destination || !training || !component) return;

  // remove member from all subgroups, including the default subgroup
  let updatedSubgroups = [...subgroups];

  // find from which subgroup the member is being dragged from and add it to changedSubgroupIds
  const fromSubgroup = updatedSubgroups.find(
    (s) => s.membersIds.includes(draggableId) && !s.parentId
  );

  if (fromSubgroup && fromSubgroup.id === destination.droppableId) return;

  if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id))
    setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);

  updatedSubgroups.forEach((s) => {
    if (!s.membersIds || s.parentId) return;
    s.membersIds = s.membersIds.filter((id) => id !== draggableId);
  });

  // Add member to the new subgroup
  if (destination.droppableId === DEFAULT_SUBGROUP_ID) {
    const newMember = users.find((user) => user.uid === draggableId);

    if (!newMember) return;

    const defaultSubgroup = updatedSubgroups.find(
      (s) => s.id === DEFAULT_SUBGROUP_ID
    );
    if (defaultSubgroup) {
      defaultSubgroup.membersIds.push(draggableId);
      defaultSubgroup.members?.push(newMember);
    }
  } else {
    const targetSubgroup = updatedSubgroups.find(
      (s) => s.id === destination.droppableId
    );

    if (!targetSubgroup) return;

    targetSubgroup.membersIds.push(draggableId);

    if (targetSubgroup && !changedSubgroupIds.includes(targetSubgroup.id))
      setChangedSubgroupIds((prev) => [...prev, targetSubgroup.id]);
  }

  // delete custom workloads subgroup
  const foundCustomUserSubgroup = component.subgroups.find(
    (subgroup) => subgroup.parentId && subgroup.membersIds.includes(draggableId)
  );

  updatedSubgroups = updatedSubgroups.filter(
    (sg) =>
      sg.id !== foundCustomUserSubgroup?.id && sg.id !== DEFAULT_SUBGROUP_ID
  );

  const updatedComponent: TrainingComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setSubgroups(updatedSubgroups);
  setComponent((prev) => {
    if (!prev) return prev;

    return updatedComponent;
  });

  setTraining((prev) => {
    if (!prev) return prev;

    if (updatedComponent.id === WARMUP_ID) {
      return {
        ...prev,
        warmup: updatedComponent,
      };
    } else if (updatedComponent.id === COOLDOWN_ID) {
      return {
        ...prev,
        cooldown: updatedComponent,
      };
    }

    return {
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === updatedComponent.id) {
          return updatedComponent;
        }
        return c;
      }),
    };
  });
}

export async function handleAddSubgroup(state: {
  training: Training;
  setTraining: SetStateNullable<Training>;
  component: TrainingComponent;
  setComponent: SetStateNullable<TrainingComponent>;
  createSubgroup: { name: string; membersIds: string[] };
  setCreateSubgroup:
    | SetState<{ name: string; membersIds: string[] }>
    | undefined;
  setDetectedChanges: SetState<boolean>;
  setSelectedSubgroup: SetState<Subgroup | null>;
  setSelectedAthlete: SetStateNullable<User>;
}) {
  const {
    training,
    setTraining,
    component,
    setComponent,
    createSubgroup,
    setCreateSubgroup,
    setDetectedChanges,
    setSelectedSubgroup,
    setSelectedAthlete,
  } = state;

  if (!training || !component) return;

  const newSubgroup: Subgroup = {
    id: `subgroup-${String(Date.now())}`,
    name: createSubgroup.name,
    supersets: [...component.supersets].map((superset) => ({
      ...superset,
      exercises: [...superset.exercises].map((exercise) => ({
        ...exercise,
      })),
    })),
    mainSet: component.mainSet,
    membersIds: createSubgroup.membersIds || [],
  };

  let updatedSubgroups = [...component.subgroups, newSubgroup];

  // delete custom workloads subgroup
  createSubgroup.membersIds.forEach((memberId) => {
    const foundCustomUserSubgroup = component.subgroups.find(
      (subgroup) => subgroup.parentId && subgroup.membersIds.includes(memberId)
    );

    if (!foundCustomUserSubgroup) return;

    updatedSubgroups = updatedSubgroups.filter(
      (sg) => sg.id !== foundCustomUserSubgroup?.id
    );
  });

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setSelectedAthlete(undefined);
  setSelectedSubgroup(newSubgroup);

  setComponent(newComponent);

  updateGlobalStates(
    training,
    component,
    newComponent,
    setTraining,
    component.id === WARMUP_ID || component.id === COOLDOWN_ID
  );

  setCreateSubgroup?.({ name: '', membersIds: [] });
  setDetectedChanges(true);
}

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

function updateGlobalStates(
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
      completedMembersIds: string[];
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
        completedMembersIds: component.completedMembersIds,
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
          completedMembersIds: component.completedMembersIds,
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
          const completed =
            foundExercise.completedMembersIds.includes(memberId);

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
            status: completed ? SetStatus.COMPLETED : SetStatus.NOT_STARTED,
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
            const fieldName = getWorkloadFieldName(paramValue, completed);

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

  /*
  const completedWorkloadsData = [];

  for (const t of trainings) {
    const foundExerciseEntry = t.stats.find((w) => w.exerciseId === exerciseId);
    if (!foundExerciseEntry) continue; // skip if no completed workloads for the selected exercise on this training
    const formatted = getFormatedDate(t.from);

    // calculation is ran on backend, no need to do it here as for future workloads
    completedWorkloadsData.push({
      trainingId: t.id,
      name: formatted,
      int1: Math.round(foundExerciseEntry.intensity * 100) / 100,
      vol1: Math.round(foundExerciseEntry.volume * 100) / 100,
      completed: true,
      plannedAt: t.from,
    } as ChartWorkloadData);
  }

  // init avg future workloads for the selected exercise
  const futureWorkloadsData = [];
  for (const t of trainings) {
    if (completedWorkloadsData.find((w) => w.trainingId === t.id)) continue; // skip if already in completed workloads
    if (!t.prescribedStats) continue; // skip if no prescribed stats
    if (!t.prescribedStats.find((w) => w.exerciseId === exerciseId)) continue; // skip if no future workloads for the selected exercise on this training

    let totalNumMembers = 0;
    const futureData = [];

    // add future workloads of main group
    for (const w of t.prescribedStats) {
      if (w.exerciseId === exerciseId && w.numMembers > 0) {
        totalNumMembers += w.numMembers;
        for (let j = 0; j < w.numMembers; j++) futureData.push(w);
      } else if (w.numMembers === 0 && futureData.length === 0) {
        futureData.push(w);
        continue;
      }
    }

    // add future workloads of all subgroups
    t.components.forEach((c) => {
      c.subgroups.forEach((sg) => {
        const futureWorkload = sg.prescribedStats.find(
          (w) => w.exerciseId === exerciseId
        );
        if (futureWorkload && futureWorkload.numMembers > 0) {
          totalNumMembers += futureWorkload.numMembers;
          for (let j = 0; j < futureWorkload.numMembers; j++)
            futureData.push(futureWorkload);
        }
      });
    });

    if (totalNumMembers === 0) totalNumMembers = 1;

    const avgIntensity =
      futureData.reduce((acc, val) => acc + val.intensity, 0) / totalNumMembers;
    const avgVolume =
      futureData.reduce((acc, val) => acc + val.volume, 0) / totalNumMembers;

    const formatted = getFormatedDate(t.from);

    futureWorkloadsData.push({
      trainingId: t.id,
      name: formatted,
      int1: Math.round(avgIntensity * 100) / 100,
      vol1: Math.round(avgVolume * 100) / 100,
      completed: false,
      plannedAt: t.from,
    } as ChartWorkloadData);
  }

  const numOfCompletedWorkloads = completedWorkloadsData.length;
  const numOfFutureWorkloads = futureWorkloadsData.length;
  const numOfTotalWorkloads = numOfCompletedWorkloads + numOfFutureWorkloads;

  const newData = [...completedWorkloadsData, ...futureWorkloadsData];

  // sort by plannedAt
  newData.sort((a, b) => {
    const dateA = new Date(a.plannedAt);
    const dateB = new Date(b.plannedAt);
    return dateA.getTime() - dateB.getTime();
  });

  setData(newData);
  setMax(numOfTotalWorkloads);
  setRange([1, numOfTotalWorkloads]);
  */
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
    ![AttributeType.Number, AttributeType.Select].includes(
      selectedParam.type
    ) ||
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
  selectedAthlete: User;
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

      const completed = component.completedMembersIds.includes(
        selectedAthlete.uid
      );

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
              status: completed ? SetStatus.COMPLETED : SetStatus.NOT_STARTED,
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
              const fieldName = getWorkloadFieldName(paramValue, completed);

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

      const completed = component.completedMembersIds.includes(
        selectedAthlete.uid
      );

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
        status: completed ? SetStatus.COMPLETED : SetStatus.NOT_STARTED,
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
        const fieldName = getWorkloadFieldName(paramValue, completed);

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
