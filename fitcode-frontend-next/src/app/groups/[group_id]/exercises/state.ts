import { CommonService } from '@/common/service/common.service';
import { Pagination } from '@/common/type/paginate.type';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { DEFAULT_EXERCISE } from './exercises-page';

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
    attributes: ExerciseAttribute[];
    component?: Component;
    filteredExercises: Exercise[];
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setExercise: SetState<Partial<Exercise>>;
    setModal: SetState<{ add: boolean; edit: boolean; import: boolean; confirmDelete: boolean }>;
  }
) {
  const {
    router,
    components,
    attributes,
    component,
    filteredExercises,
    setFilteredExercises,
    setExercises,
    setExercise,
    setModal,
  } = state;

  if (!input.name) return toast.error('Name is required');
  if (!input.componentsIds?.length)
    return toast.error('Select at least one component to add');

  // find all nested select attributes and convert them to a multi-level object
  const attributeValues: Record<string, any> = {};
  const nestedSelectAttributes = attributes
    .filter(
      (attribute) =>
        attribute.type === 'select' && typeof attribute.values?.[0] === 'object'
    )
    .map((attribute) => attribute.field);

  for (const key of nestedSelectAttributes) {
    const nested = commonService.object.nestObject(
      input.attributeValues || {},
      key
    );

    if (nested) attributeValues[key] = nested;
  }

  // add all other attributes
  const otherAttributes = attributes.filter(
    (attribute) => !nestedSelectAttributes.includes(attribute.field)
  );

  for (const attribute of otherAttributes)
    attributeValues[attribute.field] = input.attributeValues?.[attribute.field];

  // delete all keys with undefined values
  Object.keys(attributeValues).forEach(
    (key) => attributeValues[key] === undefined && delete attributeValues[key]
  );

  handleApiRequest(
    router,
    () =>
      ExerciseController.create(token, {
        name: input.name!,
        componentsIds: input.componentsIds!,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        attributeValues,
      }),
    (exercise) => {
      const id = exercise.id;
      const rootComponents = input.componentsIds!.map((cId) => {
        const component = components.find((c) => c.id === cId)!;
        return commonService.tree.getRoot(component, components);
      });

      if (
        !component ||
        (component && rootComponents.map((c) => c.id).includes(component.id))
      )
        setFilteredExercises([
          ...filteredExercises,
          { ...input, id } as Exercise,
        ]);

      setExercises((prev) => [...prev!, { ...input, id } as Exercise]);
      toast.success('Successfully added exercise');
      setExercise(DEFAULT_EXERCISE)
      setModal((prev) => ({ ...prev, add: false }));
    }
  );
}

export async function handleUpdateExercise(
  token: string,
  exerciseId: string,
  input: Partial<Exercise>,
  state: {
    router: AppRouterInstance;
    components: Component[];
    attributes: ExerciseAttribute[];
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setExercise: SetState<Partial<Exercise>>;
    setModal: SetState<{ add: boolean; edit: boolean; import: boolean; confirmDelete: boolean }>;
  }
) {
  const {
    router,
    components,
    attributes,
    setFilteredExercises,
    setExercises,
    setExercise,
    setModal,
  } = state;

  if (!input.name) return toast.error('Name is required');

  if (!input.componentsIds?.length || (input.componentsIds[0] === '' && input.componentsIds.length === 1))
    return toast.error('Select at least one component to add');

  // find all nested select attributes and convert them to a multi-level object
  const attributeValues: Record<string, any> = {};
  const nestedSelectAttributes = attributes
    .filter(
      (attribute) =>
        attribute.type === 'select' && typeof attribute.values?.[0] === 'object'
    )
    .map((attribute) => attribute.field);

  for (const key of nestedSelectAttributes) {
    const nested = commonService.object.nestObject(
      input.attributeValues || {},
      key
    );

    if (nested) attributeValues[key] = nested;
  }

  // add all other attributes
  const otherAttributes = attributes.filter(
    (attribute) => !nestedSelectAttributes.includes(attribute.field)
  );

  for (const attribute of otherAttributes)
    attributeValues[attribute.field] = input.attributeValues?.[attribute.field];

  // delete all keys with undefined values
  Object.keys(attributeValues).forEach(
    (key) => attributeValues[key] === undefined && delete attributeValues[key]
  );

  handleApiRequest(
    router,
    () =>
      ExerciseController.update(token, exerciseId, {
        name: input.name!,
        componentsIds: input.componentsIds!,
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
