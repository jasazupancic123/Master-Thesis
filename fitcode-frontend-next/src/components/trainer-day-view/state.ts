import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import toast from 'react-hot-toast';
import { DEFAULT_SUBGROUP } from './constant';

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
}) {
  const {
    training,
    setTraining,
    component,
    setComponent,
    createSubgroup,
    setCreateSubgroup,
  } = state;

  if (!training || !component) return;

  const newSubgroup: Subgroup = {
    id: `subgroup-${String(Date.now())}`,
    name: createSubgroup.name,
    supersets: component.supersets,
    membersIds: createSubgroup.membersIds || [],
  };

  setComponent((prev) => ({
    ...prev!,
    subgroups: [...prev!.subgroups, newSubgroup],
  }));

  setTraining((prev) => ({
    ...prev!,
    components: prev!.components.map((c) =>
      c.id === component.id
        ? { ...c, subgroups: [...c.subgroups, newSubgroup] }
        : c
    ),
  }));

  setCreateSubgroup?.({ name: '', membersIds: [] });
}

export function handleDeleteSubgroup(
  input: { subgroupId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
  }
) {
  const { subgroupId } = input;
  const { training, setTraining, component, setComponent } = state;
  if (!training || !component) return;

  const updatedSubgroups = component.subgroups.filter(
    (subgroup) => subgroup.id !== subgroupId
  );

  setComponent((prev) => ({
    ...prev!,
    subgroups: updatedSubgroups,
  }));

  setTraining((prev) => ({
    ...prev!,
    components: prev!.components.map((c) =>
      c.id === component.id ? { ...c, subgroups: updatedSubgroups } : c
    ),
  }));
}

export async function onDragEnd(
  input: any,
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    supersets: Superset[];
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
  }
) {
  const { destination, draggableId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersets,
    supersetsWithAdd,
    setSupersetsWithAdd,
  } = state;

  if (!destination || !training || !component) return;

  if (destination.droppableId === 'addSupersetDroppable') {
    if (supersets.length >= 4)
      return toast.error('You can only have 4 supersets per component');

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

    setSupersetsWithAdd([...newSupersets]);
    setComponent({ ...component, supersets: newSupersets });
    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === component.id ? { ...c, supersets: newSupersets } : c
      ),
    });

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

    setComponent({
      ...component,
      supersets: supersetsCopy.map((superset) =>
        superset === supersetWithExercise ? newSuperset : superset
      ),
    });

    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === component.id ? { ...c, supersets: supersetsCopy } : c
      ),
    });

    setSupersetsWithAdd(
      supersets.map((s) => (s === supersetWithExercise ? newSuperset : s))
    );

    return;
  }

  if (supersetWithNewExercise.exercises.length >= 4)
    return toast.error('You can only have 4 exercises per superset');

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
  const oldFinalSuperset = supersetWithExercise.exercises.filter(
    (e) => e.id !== draggableId
  );

  const finalSupersetsCopy = supersetsCopy.map((superset) =>
    superset === supersetWithExercise
      ? { ...superset, exercises: oldFinalSuperset }
      : superset
  );

  setSupersetsWithAdd(finalSupersetsCopy);
  setComponent({ ...component, supersets: finalSupersetsCopy });
  setTraining({
    ...training,
    components: training.components.map((c) =>
      c.id === component.id ? { ...c, supersets: finalSupersetsCopy } : c
    ),
  });
}

export function handleDeleteExercise(
  input: { exerciseId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
  }
) {
  const { exerciseId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersetsWithAdd,
    setSupersetsWithAdd,
  } = state;

  if (!component || !training) return;

  const updatedSupersets = supersetsWithAdd.map((superset) => ({
    ...superset,
    exercises: superset.exercises.filter((e) => e.id !== exerciseId),
  }));

  const newComponent = {
    ...component,
    supersets: updatedSupersets,
  };

  setSupersetsWithAdd(updatedSupersets);
  setComponent(newComponent);
  setTraining({
    ...training,
    components: training.components.map((c) =>
      c.id === component.id ? newComponent : c
    ),
  });
}

export function handleDeleteSuperset(
  input: { index: number },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
  }
) {
  const { index } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersetsWithAdd,
    setSupersetsWithAdd,
  } = state;

  if (!component || !training) return;

  const updatedSupersets = supersetsWithAdd.filter((_, i) => i !== index);
  const newComponent = {
    ...component,
    supersets: updatedSupersets,
  };

  setSupersetsWithAdd(updatedSupersets);
  setComponent(newComponent);
  setTraining({
    ...training,
    components: training.components.map((c) =>
      c.id === component.id ? newComponent : c
    ),
  });
}
