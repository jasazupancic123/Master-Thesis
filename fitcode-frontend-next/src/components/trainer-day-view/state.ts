import { CommonService } from '@/common/service/common.service';
import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import dayjs, { Dayjs } from 'dayjs';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { DEFAULT_SUBGROUP, NUM_MAX_SUPERSETS } from './constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';

export async function handleCopyTraining(
  token: string,
  input: {
    newDate: Dayjs;
    period: string;
  },
  state: {
    router: AppRouterInstance;
    training: Training;
    cycle: Cycle;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { newDate, period } = input;
  const {
    router,
    training,
    cycle,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
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

  const to = newDate
    .set('year', newDate.year())
    .set('month', newDate.month())
    .set('date', newDate.date())
    .set('hour', pair.end)
    .set('minute', 0)
    .set('second', 0)
    .toString();

  handleApiRequest(
    router,
    () => TrainingController.copy(token, training.id, { from, to }),
    (copiedTraining) => {
      copiedTraining.from = new Date(copiedTraining.from);
      copiedTraining.to = new Date(copiedTraining.to);
      copiedTraining = TrainingService.mapExercises(copiedTraining, exercises);
      copiedTraining = TrainingService.mapComponents(
        copiedTraining,
        components
      );

      setTrainings((prev) =>
        [...prev, copiedTraining].sort(
          (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
        )
      );

      setFilteredTrainings((prev) =>
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
  { destination, draggableId }: any,
  state: {
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    changedSubgroupIds: string[];
    setChangedSubgroupIds: SetState<string[]>;
    availableMembers: User[];
    setAvailableMembers: SetState<User[]>;
    users: User[];
    setTraining: SetStateNullable<Training>;
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
    setTraining,
  } = state;

  if (!destination) return;

  // remove member from all subgroups, including the default subgroup
  const updatedSubgroups = [...subgroups];

  // find from which subgroup the member is being dragged and add it to changedSubgroupIds
  const fromSubgroup = updatedSubgroups.find((s) =>
    s.membersIds.includes(draggableId)
  );

  if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id))
    setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);

  [DEFAULT_SUBGROUP(availableMembers), ...updatedSubgroups].forEach((s) => {
    if (!s.membersIds) return;
    s.membersIds = s.membersIds.filter((id) => id !== draggableId);
  });

  // Add member to the new subgroup
  if (destination.droppableId === 'default') {
    if (!availableMembers.some((user) => user.uid === draggableId))
      setAvailableMembers((prev) => [
        ...prev,
        users.find((user) => user.uid === draggableId)!,
      ]);
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

  setTraining((prev: any) => {
    if (!prev) return null;
    return { ...prev, subgroups: updatedSubgroups };
  });

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
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
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
    setTrainings,
    setFilteredTrainings,
    setAvailableMembers,
    component,
    setComponent,
    users,
  } = state;

  if (subgroupId === 'default' || !training || !component) return;

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

  setTrainings((prev) =>
    prev.map((t) =>
      t.id === training?.id ? { ...t, subgroups: updatedSubgroups } : t
    )
  );

  setFilteredTrainings((prev) =>
    prev.map((t) =>
      t.id === training?.id ? { ...t, subgroups: updatedSubgroups } : t
    )
  );
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
  filteredTrainings: Training[];
  setFilteredTrainings: SetState<Training[]>;
  setDetectedChanges: SetState<boolean>;
}) {
  const {
    training,
    setTraining,
    component,
    setComponent,
    createSubgroup,
    setCreateSubgroup,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
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

  setComponent(newComponent);

  updateGlobalStates(
    training,
    component,
    newComponent,
    filteredTrainings,
    setTraining,
    setFilteredTrainings,
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
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { subgroupId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    filteredTrainings,
    setFilteredTrainings,
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

  const newTraining = { ...training, components: updatedComponents };
  setTraining(newTraining);

  const updatedTrainings = filteredTrainings.map((filteredTraining) => {
    if (filteredTraining.id === training.id) {
      return newTraining;
    }
    return filteredTraining;
  });

  setFilteredTrainings(updatedTrainings);
}

export async function onDragEnd(
  input: any,
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: { subgroup: Subgroup | null; index: number } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
    supersets: Superset[];
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
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
    supersetsWithAdd,
    setSupersetsWithAdd,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
  } = state;

  if (!destination || !training || !component) return;

  if (destination.droppableId === 'addSupersetDroppable') {
    if (supersets.length >= NUM_MAX_SUPERSETS)
      return toast.error(
        `You can only have ${NUM_MAX_SUPERSETS} supersets per component`
      );

    const supersetsCopy = [...supersetsWithAdd];
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

    setSupersetsWithAdd([...newSupersets]);
    if (selectedSubgroup?.subgroup) {
      const updatedSubgroup = {
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
      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        filteredTrainings,
        setTraining,
        setFilteredTrainings,
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
        filteredTrainings,
        setTraining,
        setFilteredTrainings,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );
    }
    return;
  }

  const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
  const supersetWithNewExercise = supersetsWithAdd[supersetIndex];
  const supersetsCopy = [...supersetsWithAdd];
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

    if (selectedSubgroup?.subgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup.subgroup,
        supersets: supersetsCopy.map((superset) =>
          superset === supersetWithExercise ? newSuperset : superset
        ),
      };

      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s, i) =>
          i === selectedSubgroup.index ? updatedSubgroup : s
        ),
      };

      setDetectedChanges(true);

      setSelectedSubgroup({
        subgroup: updatedSubgroup,
        index: selectedSubgroup.index,
      });
      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        filteredTrainings,
        setTraining,
        setFilteredTrainings,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );

      setSupersetsWithAdd(
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
        filteredTrainings,
        setTraining,
        setFilteredTrainings,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );

      setSupersetsWithAdd(
        supersets.map((s) => (s === supersetWithExercise ? newSuperset : s))
      );
    }
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
  supersetWithNewExercise.exercises.push(
    supersetWithExercise.exercises[exerciseIndex]
  );

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

  setSupersetsWithAdd(finalSupersetsCopy);
  if (selectedSubgroup?.subgroup) {
    const updatedSubgroup = {
      ...selectedSubgroup.subgroup,
      supersets: finalSupersetsCopy,
    };
    const updatedComponent = {
      ...component,
      subgroups: component.subgroups.map((s, i) =>
        i === selectedSubgroup.index ? updatedSubgroup : s
      ),
    };

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      filteredTrainings,
      setTraining,
      setFilteredTrainings,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );

    setSelectedSubgroup({
      subgroup: updatedSubgroup,
      index: selectedSubgroup.index,
    });
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
      filteredTrainings,
      setTraining,
      setFilteredTrainings,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  }
  setDetectedChanges(true);
}

export function handleDeleteExercise(
  input: { exerciseId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: { subgroup: Subgroup | null; index: number } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { exerciseId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    supersetsWithAdd,
    setSupersetsWithAdd,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
  } = state;

  if (!component || !training) return;

  const exerciseToDelete = supersetsWithAdd.find((superset) =>
    superset.exercises.find((e) => e.id === exerciseId)
  );

  setDetectedChanges(true);

  let updatedSupersets = supersetsWithAdd.map((superset) => ({
    ...superset,
    exercises: superset.exercises.filter((e) => e.id !== exerciseId),
  }));

  //check if a superset is empty, if it is, delete it
  updatedSupersets = updatedSupersets.filter(
    (superset) => superset.exercises.length > 0
  );

  if (selectedSubgroup?.subgroup) {
    // update selected subgroup's supersets
    const updatedSubgroup = {
      ...selectedSubgroup.subgroup,
      supersets: updatedSupersets,
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

    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);

    const updatedTrainings = filteredTrainings.map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);
  } else {
    const updatedComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    setSupersetsWithAdd(updatedSupersets);
    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);

    const updatedTrainings = filteredTrainings.map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);
  }
}

export function handleDeleteSuperset(
  input: { index: number },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: { subgroup: Subgroup | null; index: number } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { index } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    supersetsWithAdd,
    setSupersetsWithAdd,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
  } = state;

  if (!component || !training) return;

  setDetectedChanges(true);

  if (selectedSubgroup?.subgroup) {
    // update selected subgroup's supersets
    const updatedSupersets = [...selectedSubgroup.subgroup.supersets].filter(
      (_, i) => i !== index
    );

    const updatedSubgroup = {
      ...selectedSubgroup.subgroup,
      supersets: updatedSupersets,
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

    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);

    const updatedTrainings = filteredTrainings.map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);

    setSupersetsWithAdd([...updatedSupersets]);
  } else {
    // update component's supersets
    const updatedSupersets = [...supersetsWithAdd].filter(
      (_, i) => i !== index
    );

    const updatedComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    setSupersetsWithAdd([...updatedSupersets]);
    setComponent(updatedComponent);
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);

    const updatedTrainings = filteredTrainings.map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);
  }
}

function updateGlobalStates(
  training: Training,
  component: TrainingComponent,
  updatedComponent: TrainingComponent,
  filteredTrainings: Training[],
  setTraining: SetState<Training | undefined>,
  setFilteredTrainings: SetState<Training[]>,
  warmupOrCooldown: boolean
) {
  if (warmupOrCooldown) {
    let newTraining = { ...training };
    if (component.id === WARMUP_ID) newTraining.warmup = updatedComponent;
    else newTraining.cooldown = updatedComponent;

    setTraining(newTraining);

    const updatedTrainings = [...filteredTrainings].map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);
  } else {
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);

    const updatedTrainings = [...filteredTrainings].map((filteredTraining) => {
      if (filteredTraining.id === training.id) {
        return newTraining;
      }
      return filteredTraining;
    });

    setFilteredTrainings(updatedTrainings);
  }
}
