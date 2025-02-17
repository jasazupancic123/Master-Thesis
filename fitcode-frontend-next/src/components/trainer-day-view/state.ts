import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Effort } from '@/controller/training/enum/effort.enum';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { WorkloadType } from '@/controller/training/enum/workload-type.enum';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { DEFAULT_SUBGROUP } from './constant';
import {
  AddSubgroupInput,
  AddSupersetInput,
  DeleteExerciseInput,
  DeleteSupersetInput,
  UpdateExerciseInput,
  UpdateSupersetInput,
} from './input';

export async function addSuperset(
  token: string,
  input: AddSupersetInput & {
    trainingId: string;
    componentId: string;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, ...restInput } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.addSuperset(token, trainingId, componentId, restInput),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to add superset'
  );
}

export async function updateSuperset(
  token: string,
  input: UpdateSupersetInput & {
    trainingId: string;
    componentId: string;
    superset: number;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, superset, ...restInput } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.updateSuperset(
        token,
        trainingId,
        componentId,
        superset,
        restInput
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to update superset'
  );
}

export async function deleteSuperset(
  token: string,
  input: DeleteSupersetInput & {
    trainingId: string;
    componentId: string;
    superset: number;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, superset, ...restInput } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.deleteSuperset(
        token,
        trainingId,
        componentId,
        superset,
        restInput
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to delete superset'
  );
}

export async function addExercise(
  token: string,
  input: {
    trainingId: string;
    componentId: string;
    superset: number;
    exerciseId: string;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, superset, exerciseId } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.addExercises(
        token,
        trainingId,
        componentId,
        superset,
        {
          exercises: [
            {
              id: exerciseId,
              meta: {
                sets: 3,
                setType: SetType.REPS,
                setTypeValue: 10,
                workloadType: WorkloadType.KG,
                workloadValue: 20,
                rec: 60,
                tempo: '0:0:0',
                effort: Effort.MODERATE,
              },
            },
          ],
        }
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to add exercises'
  );
}

export async function updateExercise(
  token: string,
  input: UpdateExerciseInput & {
    trainingId: string;
    componentId: string;
    superset: number;
    exerciseId: string;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, superset, exerciseId, ...restInput } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.updateExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId,
        restInput
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      console.log(
        training.components['rom']?.supersets?.[0]?.exercises[
          'wtqgA3f3Id5M9xqIA6oq'
        ]?.meta
      );

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to update exercise'
  );
}

export async function deleteExercise(
  token: string,
  input: DeleteExerciseInput & {
    trainingId: string;
    componentId: string;
    superset: number;
    exerciseId: string;
  },
  state: {
    router: AppRouterInstance;
    setTraining: SetStateNullable<Training>;
    setFilteredTrainings: SetState<Training[]>;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId, superset, exerciseId, ...restInput } = input;
  const {
    router,
    setTraining,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
  } = state;

  handleApiRequest(
    router,
    () =>
      TrainingController.deleteExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId,
        restInput
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to delete exercise'
  );
}

export async function addSubgroup(
  token: string,
  input: AddSubgroupInput,
  state: {
    router: AppRouterInstance;
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    setCreateSubgroup: SetState<AddSubgroupInput>;
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
    setCreateSubgroup,
    components,
    exercises,
  } = state;

  if (!training) return;

  handleApiRequest(
    router,
    () => TrainingController.addSubgroup(token, training.id, input),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      const uniqueNewSubgroups = Object.values(training.subgroups).filter(
        (s) => !subgroups.find((sub) => sub.id === s.id)
      );

      setSubgroups((prev) => [...prev, ...uniqueNewSubgroups]);
      setTraining(training);
      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      setCreateSubgroup({ name: '', membersIds: [] });

      toast.success('Successfully added new subgroup');
    },
    undefined,
    'Failed to add new subgroup'
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
    setDetectedSubgroupChanges: SetState<boolean>;
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
    setDetectedSubgroupChanges,
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

    const subgroupEntries = Object.fromEntries(
      updatedSubgroups.map((subgroup) => [subgroup.id, subgroup])
    );

    return { ...prev, subgroups: subgroupEntries };
  });
  setDetectedSubgroupChanges(true);
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
    users: User[];
    setDetectedSubgroupChanges: SetState<boolean>;
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
    users,
    setDetectedSubgroupChanges,
  } = state;

  if (subgroupId === 'default' || !training) return;

  const updatedSubgroups = subgroups.map((s) => ({
    ...s,
    membersIds: s.membersIds.filter((id) => id !== memberId),
  }));

  setDetectedSubgroupChanges(true);
  setSubgroups(updatedSubgroups);
  setAvailableMembers((prev) => [
    ...prev,
    users.find((user) => user.uid === memberId)!,
  ]);

  const subgroupEntries = Object.fromEntries(
    updatedSubgroups.map((subgroup) => [subgroup.id, subgroup])
  );

  setTraining((prev) => ({ ...prev!, subgroups: subgroupEntries }));
  setTrainings((prev) =>
    prev.map((t) =>
      t.id === training?.id ? { ...t, subgroups: subgroupEntries } : t
    )
  );

  setFilteredTrainings((prev) =>
    prev.map((t) =>
      t.id === training?.id ? { ...t, subgroups: subgroupEntries } : t
    )
  );
}

export async function handleDeleteSubgroup(
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
}

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

  handleApiRequest(
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
  );
}
