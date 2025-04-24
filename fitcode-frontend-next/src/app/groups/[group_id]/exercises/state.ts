import { CommonService } from '@/common/service/common.service';
import { Pagination } from '@/common/type/paginate.type';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { DEFAULT_EXERCISE } from './exercises-page';
import { ExerciseAttributeValue } from '@/controller/exercise/type/exercise-attribute-value.type';

const commonService = CommonService.instance;

export function handlePaginateExercises(
  filter: { componentsIds?: string[]; name?: string },
  state: {
    components: Component[];
    exercises: Exercise[];
    pagination: Pagination;
    setFilteredExercises: SetState<Exercise[]>;
    setPagination: SetState<Pagination>;
  }
) {
  const {
    components,
    exercises,
    pagination,
    setFilteredExercises,
    setPagination,
  } = state;

  let filtered = ExerciseService.filter(exercises, filter, components);
  const total = filtered.length;

  // paginate
  const pages = Math.ceil(total / pagination.pageSize);
  const page = pages < pagination.pages ? 1 : pagination.page;
  filtered = commonService.generic.paginate(filtered, {
    page,
    pageSize: pagination.pageSize,
    orderBy: { field: 'name', value: 'asc' },
  });

  // populate exercises
  filtered.map((exercise) =>
    ExerciseService.mapComponents(
      ExerciseService.mapAttributes(exercise),
      components
    )
  );

  setFilteredExercises(filtered);
  setPagination((prev) => ({ ...prev, page, total, pages }));
}

export async function handleAddExercise(
  token: string,
  input: Partial<Exercise>,
  state: {
    router: AppRouterInstance;
    components: Component[];
    component?: Component;
    filteredExercises: Exercise[];
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setExercise: SetState<Partial<Exercise>>;
    setModal: SetState<{
      add: boolean;
      edit: boolean;
      import: boolean;
      confirmDelete: boolean;
    }>;
  }
) {
  const {
    router,
    components,
    component,
    filteredExercises,
    setFilteredExercises,
    setExercises,
    setExercise,
    setModal,
  } = state;

  if (!input.name) return toast.error('Name is required');
  if (!input.componentIds?.length)
    return toast.error('Select at least one component to add');

  const attributeValues = [] as ExerciseAttributeValue[];
  for (const key in input.valuesObject) {
    const attributeValue: Partial<ExerciseAttributeValue> = {
      field: key,
      selected: input.valuesObject[key],
      value: input.valuesObject[key],
      componentIds: input.componentIds || [],
    };
    attributeValues.push(attributeValue as ExerciseAttributeValue);
  }
  input.attributeValues = attributeValues;
  delete input.valuesObject;

  handleApiRequest(
    router,
    () =>
      ExerciseController.create(token, {
        name: input.name!,
        componentIds: input.componentIds!,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction,
        attributeValues: input.attributeValues as Record<string, any>,
      }),
    (exercise) => {
      const id = exercise.id;
      const rootComponents = exercise.componentIds!.map((cId) => {
        const component = components.find((c) => c.id === cId)!;
        return commonService.tree.getRoot(component, components);
      });

      if (
        !component ||
        (component && rootComponents.map((c) => c.id).includes(component.id))
      )
        setFilteredExercises([
          ...filteredExercises,
          { ...exercise, id } as Exercise,
        ]);

      setExercises((prev) => [...prev!, { ...exercise, id } as Exercise]);
      toast.success('Successfully added exercise');
      setExercise(DEFAULT_EXERCISE);
      setModal((prev) => ({ ...prev, add: false }));
    },
    undefined,
    'Failed to create exercise'
  );
}

export async function handleUpdateExercise(
  token: string,
  exerciseId: string,
  input: Partial<Exercise>,
  state: {
    router: AppRouterInstance;
    components: Component[];
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setExercise: SetState<Partial<Exercise>>;
    setModal: SetState<{
      add: boolean;
      edit: boolean;
      import: boolean;
      confirmDelete: boolean;
    }>;
  }
) {
  const {
    router,
    components,
    setFilteredExercises,
    setExercises,
    setExercise,
    setModal,
  } = state;

  if (!input.name) return toast.error('Name is required');

  if (!input.name) return toast.error('Name is required');
  if (!input.componentIds?.length)
    return toast.error('Select at least one component to add');

  const attributeValues = [] as ExerciseAttributeValue[];
  for (const key in input.valuesObject) {
    const attributeValue: Partial<ExerciseAttributeValue> = {
      field: key,
      selected: input.valuesObject[key],
      value: input.valuesObject[key],
      componentIds: input.componentIds || [],
    };
    attributeValues.push(attributeValue as ExerciseAttributeValue);
  }
  input.attributeValues = attributeValues;
  delete input.valuesObject;

  handleApiRequest(
    router,
    () =>
      ExerciseController.update(token, exerciseId, {
        name: input.name!,
        componentIds: input.componentIds!,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        attributeValues,
      }),
    (exercise) => {
      exercise = ExerciseService.mapAttributes(exercise);
      exercise = ExerciseService.mapComponents(exercise, components);
      setExercise(exercise);

      setFilteredExercises((prev) =>
        prev.map((e) => (e.id === exercise.id ? exercise : e))
      );

      setExercises((prev) =>
        prev.map((e) => (e.id === exercise.id ? exercise : e))
      );

      toast.success('Successfully updated exercise');
      setModal((prev) => ({ ...prev, edit: false }));
    },
    undefined,
    'Failed to update exercise'
  );
}

export async function handleDeleteExercise(
  token: string,
  exerciseId: string,
  state: {
    router: AppRouterInstance;
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setFilteredExercises, setExercises } = state;

  handleApiRequest(
    router,
    () => ExerciseController.delete(token, exerciseId),
    () => {
      setFilteredExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));

      toast.success('Successfully deleted exercise');
    },
    undefined,
    'Failed to delete exercise'
  );
}
