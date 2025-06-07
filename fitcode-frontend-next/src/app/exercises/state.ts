import { SetState, handleApiRequest } from '@/common/type/state.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseAttributeValue } from '@/controller/exercise/type/exercise-attribute-value.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { CommonService } from '@/common/service/common.service';
import { Pagination } from '@/common/type/paginate.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { DEFAULT_EXERCISE } from '../../sites/exercises.page';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';

const commonService = CommonService.instance;

function getBeforeLastColon(str: string) {
  const lastColonIndex = str.lastIndexOf(':');
  return lastColonIndex === -1 ? str : str.slice(0, lastColonIndex);
}

const getAfterLastColon = (str: string) => str.replace(/.*:(.*)/, '$1') || str;

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
    attributes: Attribute[];
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
    attributes,
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

  // find all nested select attributes and convert them to a multi-level object
  const attributeValues: ExerciseAttributeValue[] = [];
  const nestedSelectAttributes = attributes
    .filter(
      (attribute) =>
        [AttributeType.Select, AttributeType.Multiselect].includes(
          attribute.type
        ) &&
        [AttributeType.Select, AttributeType.Multiselect].includes(
          attribute.options?.[0]?.type || AttributeType.Value
        )
    )
    .map((attribute) => attribute.field);

  for (const key of nestedSelectAttributes) {
    const nested = ExerciseService.parseAttributeValue(
      input.valuesObject || {},
      key
    );

    if (nested[key])
      attributeValues.push({
        field: key,
        selected: getBeforeLastColon(nested[key]),
        value: getAfterLastColon(nested[key]),
        componentIds: input.componentIds || [],
      } as ExerciseAttributeValue);
  }

  // add all other attributes
  const otherAttributes = attributes.filter(
    (attribute) => !nestedSelectAttributes.includes(attribute.field)
  );

  for (const attribute of otherAttributes) {
    const valueWithColons = input.valuesObject?.[attribute.field];
    if (valueWithColons)
      attributeValues.push({
        field: attribute.field,
        selected: getBeforeLastColon(valueWithColons),
        value: getAfterLastColon(valueWithColons),
        componentIds: input.componentIds || [],
      } as ExerciseAttributeValue);
  }

  handleApiRequest(
    router,
    () =>
      ExerciseController.create(token, {
        name: input.name!,
        componentIds: input.componentIds!,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction,
        attributeValues: attributeValues,
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
    attributes: Attribute[];
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
    attributes,
    setFilteredExercises,
    setExercises,
    setExercise,
    setModal,
  } = state;

  if (!input.name) return toast.error('Name is required');
  if (!input.componentIds?.length)
    return toast.error('Select at least one component to add');

  // find all nested select attributes and convert them to a multi-level object
  const attributeValues: ExerciseAttributeValue[] = [];
  const nestedSelectAttributes = attributes
    .filter(
      (attribute) =>
        [AttributeType.Select, AttributeType.Multiselect].includes(
          attribute.type
        ) &&
        [AttributeType.Select, AttributeType.Multiselect].includes(
          attribute.options?.[0]?.type || AttributeType.Value
        )
    )
    .map((attribute) => attribute.field);

  for (const key of nestedSelectAttributes) {
    const nested = ExerciseService.parseAttributeValue(
      input.valuesObject || {},
      key
    );

    if (nested[key])
      attributeValues.push({
        field: key,
        selected: getBeforeLastColon(nested[key]),
        value: getAfterLastColon(nested[key]),
        componentIds: input.componentIds || [],
      } as ExerciseAttributeValue);
  }

  // add all other attributes
  const otherAttributes = attributes.filter(
    (attribute) => !nestedSelectAttributes.includes(attribute.field)
  );

  for (const attribute of otherAttributes) {
    const valueWithColons = input.valuesObject?.[attribute.field];
    if (valueWithColons)
      attributeValues.push({
        field: attribute.field,
        selected: getBeforeLastColon(valueWithColons),
        value: getAfterLastColon(valueWithColons),
        componentIds: input.componentIds || [],
      } as ExerciseAttributeValue);
  }

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

export async function handleCsvFileUpload(
  file: File,
  state: { setImportedExercises: SetState<Exercise[]> }
) {
  const { setImportedExercises } = state;

  const text = await file.text();
  const rows = text.split('\n').filter((row) => row);

  const importedExercises: Exercise[] = rows.map((row, i) => {
    const [name, componentSlug, videoUrl, imageUrl] = row.split(',');
    const exercise = {
      id: i.toString(),
      name,
      componentIds: [componentSlug],
      ownerId: 'global',
      imageUrl,
      videoUrl,
      instruction: undefined,
      attributeValues: [] as ExerciseAttributeValue[],
      valuesObject: {} as Record<string, any>,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Exercise;
    return exercise;
  });

  setImportedExercises(importedExercises);
}

export async function handleCreateManyExercises(
  token: string,
  input: Parameters<typeof ExerciseController.createMany>[1],
  state: {
    router: AppRouterInstance;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises } = state;

  handleApiRequest(
    router,
    () => ExerciseController.createMany(token, input),
    (exercises) => {
      setExercises((prev) => [...prev, ...exercises]);
      toast.success('Successfully imported exercises!');
    },
    undefined,
    'Failed to import exercises'
  );
}
