import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { DEFAULT_SUBGROUP } from './constant';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';

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

  const updatedSubgroups = subgroups.map((s) => ({
    ...s,
    membersIds: s.membersIds.filter((id) => id !== memberId),
  }));

  setSubgroups(updatedSubgroups);
  setAvailableMembers((prev) => [
    ...prev,
    users.find((user) => user.uid === memberId)!,
  ]);

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setComponent(newComponent);
  //update component in training
  setTraining((prev: any) => {
    if (!prev) return null;
    return {
      ...prev,
      components: prev.components.map((c: any) =>
        c.id === newComponent.id ? newComponent : c
      ),
    };
  });

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

/* export async function handleDeleteSubgroup(
  token: string,
  input: {
    subgroupId: string;
  },
  state: {
    router: AppRouterInstance;
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    setAvailableMembers: SetState<User[]>;
    users: User[];
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { subgroupId } = input;
  const {
    router,
    subgroups,
    setSubgroups,
    training,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    setAvailableMembers,
    users,
    components,
    exercises,
  } = state;

  const deletedSubgroup = subgroups.find((s) => s.id === subgroupId)!;
  const deletedMembers = [...deletedSubgroup.membersIds!];
  const updatedSubgroups = subgroups.filter((s) => s.id !== subgroupId);

  handleApiRequest(
    router,
    () =>
      TrainingController.updateSubgroups(token, training.id, {
        subgroups: updatedSubgroups.map((s) => {
          const { components: _, ...subgroup } = s;
          return subgroup;
        }),
      }),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setSubgroups(updatedSubgroups);
      setAvailableMembers((prev) => [
        ...prev,
        ...deletedMembers.map((id) => users.find((u) => u.uid === id)!),
      ]);

      setTraining(training);

      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      toast.success('Subgroup successfully deleted');
    },
    undefined,
    'Failed to delete subgroup'
  );
} */

export async function handleSaveSubgroupChanges(
  token: string,
  state: {
    router: AppRouterInstance;
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    setDetectedSubgroupChanges: SetState<boolean>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const {
    router,
    subgroups,
    setSubgroups,
    training,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    setDetectedSubgroupChanges,
    components,
    exercises,
  } = state;

  if (!training) return;

  /* handleApiRequest(
    router,
    () =>
      TrainingController.updateSubgroups(token, training.id, {
        subgroups: subgroups.map((s) => {
          const { components: _, ...subgroup } = s;
          return subgroup;
        }),
      }),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setDetectedSubgroupChanges(false);
      setSubgroups(Object.values(training.subgroups));
      setTraining(training);

      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      toast.success('Subgroup changes saved successfully');
    },
    undefined,
    'Failed to save subgroup changes'
  ); */
}
