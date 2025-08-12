import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import {
  DEFAULT_SUBGROUP,
  DEFAULT_SUBGROUP_ID,
  NUM_MAX_SUPERSETS,
} from './constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { CommonService } from '@/common/service/common.service';
import type { Day } from '@/common/service/util/date.util';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Method } from '@/controller/method/type/method.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User } from '@/controller/user/type/user.type';
import { WorkloadValue } from '@/controller/training/type/workload-value.type';
import {
  IntType,
  ParamType,
  VolType,
} from '@/controller/component/enum/param.enum';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { SetStatus } from '@/controller/training/enum/set-status.enum';

export async function handleCopyTraining(
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
    () => TrainingController.copy(training.id, { from: new Date(from) }),
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
    availableMembers: User[];
    setAvailableMembers: SetState<User[]>;
    users: User[];
    component: TrainingComponent | undefined;
    training: Training | undefined;
  }
) {
  const {
    subgroups,
    setSubgroups,
    changedSubgroupIds,
    setChangedSubgroupIds,
    availableMembers,
    setAvailableMembers,
    users,
    component,
    training,
  } = state;

  if (!destination || !training || !component) return;

  // remove member from all subgroups, including the default subgroup
  const updatedSubgroups = [...subgroups];

  // find from which subgroup the member is being dragged and add it to changedSubgroupIds
  const fromSubgroup = updatedSubgroups.find((s) =>
    s.membersIds.includes(draggableId)
  );

  if (fromSubgroup && fromSubgroup.id === destination.droppableId) return;

  if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id))
    setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);

  [DEFAULT_SUBGROUP(availableMembers), ...updatedSubgroups].forEach((s) => {
    if (!s.membersIds) return;
    s.membersIds = s.membersIds.filter((id) => id !== draggableId);
  });

  // Add member to the new subgroup
  if (destination.droppableId === DEFAULT_SUBGROUP([]).id) {
    if (!availableMembers.some((user) => user.uid === draggableId)) {
      setAvailableMembers((prev) => [
        ...prev,
        users.find((user) => user.uid === draggableId)!,
      ]);
    }
  } else {
    const targetSubgroup = updatedSubgroups.find(
      (s) => s.id === destination.droppableId
    );

    if (targetSubgroup) targetSubgroup.membersIds.push(draggableId);

    setAvailableMembers((prev) =>
      prev.filter((user) => user.uid !== draggableId)
    );

    if (targetSubgroup && !changedSubgroupIds.includes(targetSubgroup.id))
      setChangedSubgroupIds((prev) => [...prev, targetSubgroup.id]);
  }

  setSubgroups(updatedSubgroups);
}

export function handleRightClickSubgroup(
  input: {
    memberId: string;
    subgroupId: string;
  },
  state: {
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    training: Training;
    setTraining: SetStateNullable<Training>;
    setAvailableMembers: SetState<User[]>;
    component: TrainingComponent | undefined;
    setComponent: SetStateNullable<TrainingComponent>;
    users: User[];
  }
) {
  const { memberId, subgroupId } = input;
  const {
    subgroups,
    setSubgroups,
    training,
    setTraining,
    setAvailableMembers,
    component,
    setComponent,
    users,
  } = state;

  if (subgroupId === DEFAULT_SUBGROUP_ID || !training || !component) return;

  const updatedComponents = [...training.components];
  const i = training.components.findIndex((c) => c.id === component.id);
  if (i === undefined || i === -1) return;

  const updatedSubgroups = subgroups.map((s) => ({
    ...s,
    membersIds: s.membersIds.filter((id) => id !== memberId),
    supersets: training.components[i]?.supersets ?? [],
  }));

  updatedComponents[i].subgroups = updatedSubgroups;

  setSubgroups(updatedSubgroups);
  setComponent(updatedComponents[i]);
  setTraining((prev) => ({ ...prev!, components: updatedComponents }));
  setAvailableMembers((prev) => [
    ...prev,
    users.find((user) => user.uid === memberId)!,
  ]);
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
  updateTrainingsAvgFutureWorkload?: boolean;
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
    updateTrainingsAvgFutureWorkload,
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
    membersIds: createSubgroup.membersIds || [],
  };

  const newComponent = {
    ...component,
    subgroups: [...component.subgroups, newSubgroup],
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

  const updatedSubgroups = subgroupsCopy.filter(
    (subgroup) => subgroup.id !== subgroupId
  );

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setComponent(newComponent);

  const updatedComponents = [...training.components].map((c) =>
    c.id === component.id ? newComponent : c
  );

  // update avg future workload values's numMembers
  const numberOfMembers = component.subgroups.find(
    (subgroup) => subgroup.id === subgroupId
  )?.membersIds.length;

  const newTraining = {
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

export async function onDragEnd(
  input: DropResult,
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
    setCustomAthleteWorkloads: SetState<Workload[]>;
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
    setCustomAthleteWorkloads,
  } = state;

  if (!destination || !training || !component) return;

  if (destination.droppableId === 'addSupersetDroppable') {
    if (supersets.length >= NUM_MAX_SUPERSETS)
      return toast.error(
        `You can only have ${NUM_MAX_SUPERSETS} supersets per component`
      );

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

    updateCustomAthleteWorkloadsSupersetIndexes({
      setCustomAthleteWorkloads,
      component,
      selectedSubgroup,
    });
    return;
  }

  const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
  const supersetWithNewExercise = supersets[supersetIndex];
  const supersetsCopy = [...supersets];
  const supersetWithExercise = supersetsCopy.find((superset) =>
    superset.exercises.find((e) => e.id === draggableId)
  );

  if (!supersetWithExercise) return;

  if (supersetWithExercise === supersetWithNewExercise) {
    // Get y coordinates of all exercises in the superset
    const sortedExercises = supersetWithExercise.exercises
      .map((e) => ({
        exercise: e,
        y:
          document.getElementById(e.id)?.getBoundingClientRect().top ??
          Infinity, // Default to Infinity if not found
      }))
      .sort((a, b) => a.y - b.y) // Sort by y coordinate
      .map((item) => item.exercise); // Extract only exercises

    const newSuperset = {
      ...supersetWithExercise,
      exercises: sortedExercises,
    };

    if (selectedSubgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: supersetsCopy.map((superset) =>
          superset === supersetWithExercise ? newSuperset : superset
        ),
      };

      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      };

      setDetectedChanges(true);

      setSelectedSubgroup(updatedSubgroup);
      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );

      setSupersets(
        supersets.map((s) => (s === supersetWithExercise ? newSuperset : s))
      );
    } else {
      const updatedComponent = {
        ...component,
        supersets: supersetsCopy.map((superset) =>
          superset === supersetWithExercise ? newSuperset : superset
        ),
      };

      setDetectedChanges(true);

      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );

      setSupersets(
        supersets.map((s) => (s === supersetWithExercise ? newSuperset : s))
      );
    }

    updateCustomAthleteWorkloadsSupersetIndexes({
      setCustomAthleteWorkloads,
      component,
      selectedSubgroup,
    });
    return;
  }

  if (supersetWithNewExercise.exercises.length >= NUM_MAX_SUPERSETS)
    return toast.error(
      `You can only have ${NUM_MAX_SUPERSETS} exercises per superset`
    );

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

  setDetectedChanges(true);

  setSupersets(finalSupersetsCopy);
  if (selectedSubgroup) {
    const updatedSubgroup = {
      ...selectedSubgroup,
      supersets: finalSupersetsCopy,
    };
    const updatedComponent = {
      ...component,
      subgroups: component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    };

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );

    setSelectedSubgroup(updatedSubgroup);
  } else {
    const updatedComponent = {
      ...component,
      supersets: finalSupersetsCopy,
    };
    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  }

  updateCustomAthleteWorkloadsSupersetIndexes({
    setCustomAthleteWorkloads,
    component,
    selectedSubgroup,
  });

  setDetectedChanges(true);
}

export function handleDeleteExercise(
  input: { exerciseId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: Subgroup | null;
    supersets: Superset[];
    setSelectedSubgroup: SetState<Subgroup | null>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { exerciseId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    setDetectedChanges,
  } = state;

  if (!component || !training) return;

  setDetectedChanges(true);

  let updatedSupersets = supersets.map((superset) => ({
    ...superset,
    exercises: superset.exercises.filter((e) => e.id !== exerciseId),
  }));

  //check if a superset is empty, if it is, delete it
  updatedSupersets = updatedSupersets.filter(
    (superset) => superset.exercises.length > 0
  );

  if (selectedSubgroup) {
    // update selected subgroup's supersets
    const updatedSubgroup: Subgroup = {
      ...selectedSubgroup,
      supersets: updatedSupersets,
    };

    const updatedComponent = {
      ...component,
      subgroups: component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    };

    setSelectedSubgroup(updatedSubgroup);

    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);
  } else {
    const updatedComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining: Training = {
      ...training,
      components: updatedComponents,
    };
    setTraining(newTraining);
  }
}

export function handleDeleteSuperset(
  input: { index: number },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    supersets: Superset[];
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setTrainings: SetState<Training[]>;
    setDetectedChanges: SetState<boolean>;
    setCustomAthleteWorkloads: SetState<Workload[]>;
    setSelectedExercises: SetState<TrainingExercise[]>;
  }
) {
  const { index } = input;
  const {
    training,
    setTraining,
    supersets,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    setTrainings,
    setDetectedChanges,
    setCustomAthleteWorkloads,
    setSelectedExercises,
  } = state;

  if (!component || !training) return;

  setDetectedChanges(true);

  if (selectedSubgroup) {
    // update selected subgroup's supersets

    const exercisesToDelete = selectedSubgroup.supersets[index].exercises;

    const updatedSupersets = [...selectedSubgroup.supersets].filter(
      (_, i) => i !== index
    );

    const updatedSubgroup = {
      ...selectedSubgroup,
      supersets: updatedSupersets,
    };

    const updatedComponent = {
      ...component,
      subgroups: component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    };

    setSelectedExercises((prev) =>
      prev.filter((e) => !exercisesToDelete.some((ex) => ex.id === e.id))
    );

    setSelectedSubgroup(updatedSubgroup);

    setComponent(updatedComponent);

    const newTraining = { ...training };

    if (component.id === WARMUP_ID) newTraining.warmup = updatedComponent;
    else if (component.id === COOLDOWN_ID)
      newTraining.cooldown = updatedComponent;
    else {
      newTraining.components = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );
    }

    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === training.id ? newTraining : t))
    );
  } else {
    // update component's supersets
    const exercisesToDelete = supersets[index].exercises;

    const updatedSupersets = [...supersets].filter((_, i) => i !== index);

    const updatedComponent: TrainingComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    setSelectedExercises((prev) =>
      prev.filter((e) => !exercisesToDelete.some((ex) => ex.id === e.id))
    );

    setComponent(updatedComponent);

    const newTraining = { ...training };

    if (component.id === WARMUP_ID) newTraining.warmup = updatedComponent;
    else if (component.id === COOLDOWN_ID)
      newTraining.cooldown = updatedComponent;
    else {
      newTraining.components = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );
    }

    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === training.id ? newTraining : t))
    );
  }

  updateCustomAthleteWorkloadsSupersetIndexes({
    setCustomAthleteWorkloads,
    component,
    selectedSubgroup,
  });
}

export function updateCustomAthleteWorkloadsSupersetIndexes(input: {
  setCustomAthleteWorkloads: SetState<Workload[]>;
  component: TrainingComponent;
  selectedSubgroup: Subgroup | null;
}) {
  const { setCustomAthleteWorkloads, component, selectedSubgroup } = input;
  setCustomAthleteWorkloads((prev) => {
    return prev.map((w) => {
      const supersetIndex = (
        selectedSubgroup ? selectedSubgroup.supersets : component.supersets
      )
        .map((s) => s.exercises)
        .flat()
        .findIndex((e) => e.id === w.exerciseId);

      if (supersetIndex === -1) return w;

      w.supersetIndex = supersetIndex;
      return w;
    });
  });
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

const groupByTrainingId = (
  workloads: Workload[],
  skipIfAlreadyInOther: boolean = false,
  otherWorkloads: {
    [key: string]: Workload[];
  } = {}
) => {
  return workloads.reduce((acc: { [key: string]: Workload[] }, workload) => {
    // skip if already in completed workloads
    if (skipIfAlreadyInOther && otherWorkloads[workload.trainingId]) return acc;
    if (!acc[workload.trainingId]) {
      acc[workload.trainingId] = [];
    }
    acc[workload.trainingId].push(workload);
    return acc;
  }, {});
};

const getFormatedDate = (from: Date) => {
  // format: "DD MM, AM/PM"
  const date = new Date(from);

  const day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (month[0] === '0') month = month.slice(1);

  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const formatted = `${day}.${month}. ${ampm}`;

  return formatted;
};

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
    if(t.id === training.id) t = training;

    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
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

    const foundExerciseInComponent = component.supersets
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

    console.log(t.from, 'workloads', workloads);

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
    let selectedParam = param.options?.find(
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

  /*
  const validIntensity1Values = workloads
    .map((w) => (completed ? w.intWork1ValueL : w.prescribedIntWork1ValueL))
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  const validIntensity2Values = workloads
    .map((w) => (completed ? w.intWork2ValueL : w.prescribedIntWork2ValueL))
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  const validVolume1Values = workloads
    .map((w) => (completed ? w.volWork1ValueL : w.prescribedVolWork1ValueL))
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  const validVolume2Values = workloads
    .map((w) => (completed ? w.volWork2ValueL : w.prescribedVolWork2ValueL))
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  const avgIntensity =
    validIntensity1Values.reduce((acc, val) => acc + val, 0) /
    validIntensity1Values.length;

  const avgVolume =
    validVolume1Values.reduce((acc, val) => acc + val, 0) /
    validVolume1Values.length;

  const date = new Date(workloads[0].plannedAt);

  const day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (month[0] === '0') month = month.slice(1);

  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Final format: "DD MM, AM/PM"
  const formatted = `${day}.${month}. ${ampm}`;

  return {
    trainingId: workloads.length ? workloads[0].trainingId : '',
    name: formatted,
    int1: Math.round(avgIntensity * 100) / 100,
    vol1: Math.round(avgVolume * 100) / 100,
    completed: completed,
    plannedAt: workloads[0].plannedAt,
  };
  */
}

export function prepareSelectedAthleteAvgWorkloadsForChart(
  customAthleteWorkloads: Workload[], // fetched
  selectedAthleteWorkloads: CompletedFutureWorkloads, // in current session -> prioritize
  trainings: Training[],
  componentId: string,
  exercise: TrainingExercise,
  selectedAthlete: User,
  selectedParams: ParamType[],
  setData: SetState<ChartWorkloadData[]>,
  setMax: SetState<number>,
  setRange: SetState<number[]>
) {
  const newData: ChartWorkloadData[] = [];

  trainings.forEach((t) => {
    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
      name,
      plannedAt: t.from,
    };

    // here are all of the customAthleteWorkloads and selectedAthleteWorkloads
    const workloads: Workload[] = [];

    // first check in selectedAthleteWorkloads, which are set in the current session
    // completedWorkloads

    const foundCompletedSelectedAthleteWorkloads =
      selectedAthleteWorkloads.completedWorkloads.filter(
        (w) =>
          w.exerciseId === exercise.id &&
          w.componentId === componentId &&
          w.trainingId === t.id
      );

    if (foundCompletedSelectedAthleteWorkloads.length)
      workloads.push(...foundCompletedSelectedAthleteWorkloads);

    // futureWorkloads
    const foundFutureSelectedAthleteWorkloads =
      selectedAthleteWorkloads.futureWorkloads.filter(
        (w) =>
          w.exerciseId === exercise.id &&
          w.componentId === componentId &&
          w.trainingId === t.id
      );

    if (foundFutureSelectedAthleteWorkloads.length)
      workloads.push(...foundFutureSelectedAthleteWorkloads);

    // second check in customAthleteWorkloads, which are fetched from the BE
    const foundCustomAthleteWorkloads = customAthleteWorkloads.filter(
      (w) =>
        w.exerciseId === exercise.id &&
        w.componentId === componentId &&
        w.trainingId === t.id
    );

    if (foundCustomAthleteWorkloads.length)
      workloads.push(...foundCustomAthleteWorkloads);

    // third check in main group or subgroup of the training

    const component = t.components.find((c) => c.id === componentId);
    if (!component) return;

    const subgroup = component.subgroups.find((s) =>
      s.membersIds.includes(selectedAthlete.uid)
    );

    const foundExercise: TrainingExercise | undefined = subgroup
      ? subgroup.supersets
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id)
      : component.supersets
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
            w.componentId === componentId &&
            w.trainingId === t.id
        )
      )
        return;

      const completed = component.completedMembersIds.includes(
        selectedAthlete.uid
      );

      const workload: Workload = {
        trainingId: t.id,
        componentId: componentId,
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

  /*
  const completedWorkloadsFiltered = selectedAthleteWorkloads.completedWorkloads
    .filter((workload) => workload.exerciseId === exerciseId)
    .sort((a, b) => (isBefore(a.plannedAt, b.plannedAt) ? -1 : 1));

  const futureWorkloadsFiltered = selectedAthleteWorkloads.futureWorkloads
    .filter((workload) => workload.exerciseId === exerciseId)
    .sort((a, b) => (isBefore(a.plannedAt, b.plannedAt) ? -1 : 1));

  const groupedCompletedWorkloads = groupByTrainingId(
    completedWorkloadsFiltered
  );

  const groupedFutureWorkloads = groupByTrainingId(
    futureWorkloadsFiltered,
    true,
    groupedCompletedWorkloads
  );

  const numOfCompletedWorkloads = Object.keys(groupedCompletedWorkloads).length;
  const numOfFutureWorkloads = Object.keys(groupedFutureWorkloads).length;
  const numOfTotalWorkloads = numOfCompletedWorkloads + numOfFutureWorkloads;

  const newData = [];
  for (const groupedWorkload of [
    groupedCompletedWorkloads,
    groupedFutureWorkloads,
  ]) {
    for (const workloads of Object.values(groupedWorkload)) {
      const validIntensityValues = workloads
        .map((w) =>
          groupedWorkload === groupedCompletedWorkloads
            ? // ? w.intWork1Value
              0
            : w.prescribedIntWork1ValueL
        )
        .filter((v) => v !== undefined)
        .map((w) => (!w ? w : parseFloat(w.toString())));

      const validVolumeValues = workloads
        .map((w) =>
          groupedWorkload === groupedCompletedWorkloads
            ? // ? w.volWork1Value
              0
            : w.prescribedVolWork1ValueL
        )
        .filter((v) => v !== undefined)
        .map((w) => (!w ? w : parseFloat(w.toString())));

      const avgIntensity =
        validIntensityValues.reduce((acc, val) => acc + val, 0) /
        validIntensityValues.length;

      const avgVolume =
        validVolumeValues.reduce((acc, val) => acc + val, 0) /
        validVolumeValues.length;

      const date = new Date(workloads[0].plannedAt);

      const day = date.getDate().toString().padStart(2, '0');
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      if (month[0] === '0') month = month.slice(1);

      const hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';

      // Final format: "DD MM, AM/PM"
      const formatted = `${day}.${month}. ${ampm}`;

      newData.push({
        trainingId: workloads.length ? workloads[0].trainingId : '',
        name: formatted,
        intensity: Math.round(avgIntensity * 100) / 100,
        volume: Math.round(avgVolume * 100) / 100,
        completed: groupedCompletedWorkloads === groupedWorkload,
        plannedAt: workloads[0].plannedAt,
      });
    }
  }

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
