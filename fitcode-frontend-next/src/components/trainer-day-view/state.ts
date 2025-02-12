import { Effort } from '@/controller/training/enum/effort.enum';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { WorkloadType } from '@/controller/training/enum/workload-type.enum';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import {
  AddSubgroupInput,
  UpdateSubgroupInput,
  AddSupersetInput,
  UpdateSupersetInput,
  DeleteSupersetInput,
  UpdateExerciseInput,
  DeleteExerciseInput,
  FilteredExercises,
} from './type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { CommonService } from '@/common/service/common.service';

export function filterExercises(
  filteredExercises: FilteredExercises,
  exercises: Exercise[],
  components: Component[],
  setFilteredExercises: SetState<FilteredExercises>
) {
  const filter = {
    componentsIds: [filteredExercises.componentId!],
    name: filteredExercises.search.name,
  };

  let filtered = ExerciseService.filter(exercises, filter, components);
  const total = filtered.length;

  // paginate
  const pages = Math.ceil(total / filteredExercises.pagination.pageSize);
  const page =
    pages < filteredExercises.pagination.pages
      ? 1
      : filteredExercises.pagination.page;

  filtered = CommonService.instance.generic.paginate(filtered, {
    page,
    pageSize: filteredExercises.pagination.pageSize,
    orderBy: { field: 'name', value: 'asc' },
  });

  // populate exercises
  filtered.map((exercise) => {
    ExerciseService.mapComponents(
      ExerciseService.mapAttributes(exercise),
      components
    );
  });

  setFilteredExercises((prev) => ({
    ...prev,
    data: filtered,
    pagination: {
      ...prev.pagination,
      total,
      pages: Math.ceil(total / prev.pagination.pageSize),
    },
  }));
}

export async function addSubgroup(
  token: string,
  training: Training,
  input: AddSubgroupInput,
  setModal: SetState<{ subgroup: boolean }>
) {
  /* ADD API CALLS HERE, THIS IS OFFLINE ONLY */
  const newSubgroup = {
    id: Math.random().toString(36).substr(2, 9),
    name: input.name,
    membersIds: input.membersIds,
    components: training.components,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Subgroup;

  training.subgroups[newSubgroup.id] = newSubgroup;
  setModal((prev) => ({ ...prev, subgroup: false }));
}

export async function editSubgroup(
  token: string,
  training: Training,
  input: UpdateSubgroupInput,
  editedSubgroup: Partial<Subgroup>,
  setEditedSubgroup: SetState<Partial<Subgroup> | null>,
  setModal: SetState<{ subgroup: boolean }>
) {
  if (!editedSubgroup) return;
  const subgroup = Object.values(training.subgroups).find(
    (s) => s.id === editedSubgroup.id
  );

  if (!subgroup) return;

  setModal((prev) => ({ ...prev, editSubgroup: false }));
  setEditedSubgroup(null);
}

export async function deleteComponent(
  token: string,
  trainingId: string,
  componentId: string,
  setSelectedTrainings: SetState<Training[]>
) {
  handleApiRequest(
    () =>
      TrainingController.deleteComponent(token, trainingId, componentId, {}),
    (training) => {
      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to delete training component'
  );
}

export async function addSuperset(
  token: string,
  trainingId: string,
  componentId: string,
  input: AddSupersetInput,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[],
  exercises: Exercise[]
) {
  handleApiRequest(
    () => TrainingController.addSuperset(token, trainingId, componentId, input),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to add superset'
  );
}

export async function updateSuperset(
  token: string,
  trainingId: string,
  componentId: string,
  superset: number,
  input: UpdateSupersetInput,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[],
  exercises: Exercise[]
) {
  handleApiRequest(
    () =>
      TrainingController.updateSuperset(
        token,
        trainingId,
        componentId,
        superset,
        input
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to update superset'
  );
}

export async function deleteSuperset(
  token: string,
  trainingId: string,
  componentId: string,
  superset: number,
  input: DeleteSupersetInput,
  setSelectedTrainings: SetState<Training[]>
) {
  handleApiRequest(
    () =>
      TrainingController.deleteSuperset(
        token,
        trainingId,
        componentId,
        superset,
        input
      ),
    (training) => {
      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to delete superset'
  );
}

export async function addExercise(
  token: string,
  trainingId: string,
  componentId: string,
  superset: number,
  exerciseId: string,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[],
  exercises: Exercise[]
) {
  handleApiRequest(
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

      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to add exercises'
  );
}

export async function updateExercise(
  token: string,
  trainingId: string,
  componentId: string,
  superset: number,
  exerciseId: string,
  input: UpdateExerciseInput,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[],
  exercises: Exercise[]
) {
  handleApiRequest(
    () =>
      TrainingController.updateExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId,
        input
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to update exercise'
  );
}

export async function deleteExercise(
  token: string,
  trainingId: string,
  componentId: string,
  superset: number,
  exerciseId: string,
  input: DeleteExerciseInput,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[],
  exercises: Exercise[]
) {
  handleApiRequest(
    () =>
      TrainingController.deleteExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId,
        input
      ),
    (training) => {
      training = TrainingService.mapComponents(training, components);
      training = TrainingService.mapExercises(training, exercises);

      setSelectedTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    'Failed to delete exercise'
  );
}
