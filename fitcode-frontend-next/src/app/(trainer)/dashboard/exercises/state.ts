import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { CommonService } from '@/common/service/common.service';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { Component } from '@/controller/component/type/component.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import type {
  CreateExerciseMuscleValues,
  Exercise,
  UpsertManyExercises,
  UpsertManyMuscleValues,
} from '@/controller/exercise/type/exercise.type';
import type { ExerciseAttributeValue } from '@/controller/exercise/type/exercise-attribute-value.type';
import { DEFAULT_EXERCISE } from '@/sites/exercises.page';

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
      muscleValues: boolean;
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

  const controller = ExerciseController.getInstance(token);

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
      controller.create({
        name: input.name!,
        componentIds: input.componentIds!,
        isUnilateral: input.isUnilateral || false,
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
      muscleValues: boolean;
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

  const controller = ExerciseController.getInstance(token);

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
      controller.update(exerciseId, {
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
  const controller = ExerciseController.getInstance(token);

  handleApiRequest(
    router,
    () => controller.delete(exerciseId),
    () => {
      setFilteredExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));

      toast.success('Successfully deleted exercise');
    },
    undefined,
    'Failed to delete exercise'
  );
}

export async function handleExerciseCsvFileUpload(
  file: File,
  state: { setImportedExercises: SetState<Exercise[]> }
) {
  const { setImportedExercises } = state;

  const text = await file.text();
  const rows = text.split('\n').filter((row) => row);

  // ignore first row if it contains headers
  if (rows[0].toLowerCase().includes('name')) rows.shift();

  const importedExercises: (Exercise | null)[] = rows.map((row) => {
    return getExerciseFromCsvRow(row);
  });

  const validExercises = importedExercises.filter(
    (e) => e !== null
  ) as Exercise[];

  setImportedExercises(validExercises);
}

export async function handleMuscleValuesCsvFileUpload(
  file: File,
  exercises: Exercise[],
  state: {
    setImportedMuscleValueExercises: SetState<CreateExerciseMuscleValues[]>;
  }
) {
  const { setImportedMuscleValueExercises } = state;

  const text = await file.text();
  const rows = text.split('\n').filter((row) => row);

  // ignore first row if it contains headers
  const headers = rows[0]
    .split(',')
    .map((header) => header.replace('\r', '').trim());
  if (rows[0].toLowerCase().includes('name')) rows.shift();

  const importedMuscleValues: (CreateExerciseMuscleValues | null)[] = rows.map(
    (row) => {
      return getMuscleValuesFromCsvRow(row, exercises, headers);
    }
  );

  const validImportedMuscleValues = importedMuscleValues.filter(
    (e) => e !== null
  ) as CreateExerciseMuscleValues[];

  setImportedMuscleValueExercises(validImportedMuscleValues);
}

export async function handleUpsertManyExercises(
  token: string,
  input: UpsertManyExercises,
  state: {
    router: AppRouterInstance;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises } = state;
  const controller = ExerciseController.getInstance(token);

  handleApiRequest(
    router,
    () => controller.upsertMany(input),
    (exercises) => {
      setExercises((prev) =>
        // if exercise already exists, update it, otherwise add it
        [
          ...prev.filter((e) => !exercises.map((ex) => ex.id).includes(e.id)),
          ...exercises,
        ]
      );
      toast.success('Successfully imported exercises!');
    },
    undefined,
    'Failed to import exercises'
  );
}

export async function handleUpsertMuscleValues(
  token: string,
  input: UpsertManyMuscleValues,
  state: {
    router: AppRouterInstance;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises } = state;
  const controller = ExerciseController.getInstance(token);

  handleApiRequest(
    router,
    () => controller.upsertManyMuscleValues(input),
    () => {
      setExercises((prev) =>
        prev.map((exercise) => {
          const foundExercise = input.exercises.find(
            (e) => e.name === exercise.name
          );
          return foundExercise
            ? {
                ...exercise,
                muscleValues: foundExercise.muscleValues,
              }
            : exercise;
        })
      );
      toast.success('Successfully imported muscle values!');
    },
    undefined,
    'Failed to import muscle values'
  );
}

function getMuscleValue(
  load: string,
  i: number,
  headers: string[]
): AttributeValue {
  const columnName = headers[i]; // example: biceps_brachi:short_biceps_brachi:short_biceps_brachi

  const [field, ...rest] = columnName.split(':');
  const selected = rest.join(':');
  const value = load;

  return {
    field,
    selected,
    value,
  };
}

function getExerciseFromCsvRow(row: string): Exercise | null {
  const columns = row.split(',');
  if (columns.length !== 21) {
    toast.error(
      `Invalid row format. Expected 21 columns, got ${columns.length}.`
    );

    return null;
  }

  const [
    name,
    componentSlug,
    videoUrl,
    imageUrl,
    isUnilateral,
    instruction,
    coordination,
    muscle,
    region,
    equipment,
    // attributes below are optional
    coeff,
    diagnosis,
    endOpts,
    loadingSide,
    location,
    method,
    movDir,
    pattern,
    prescr,
    priority,
    sportTask,
  ] = columns;

  const attributeValues: AttributeValue[] = [
    {
      field: 'instruction',
      selected: '',
      value: instruction,
    },
    {
      field: 'coordination',
      selected: '',
      value: commonService.object.toBoolean(coordination) ? 'true' : 'false',
    },
    {
      field: 'muscle',
      selected: muscle,
      value: muscle,
    },
    {
      field: 'region',
      selected: region,
      value: region,
    },
    {
      field: 'equipment',
      selected: getBeforeLastColon(equipment),
      value: getAfterLastColon(equipment),
    },
  ];

  if (coeff)
    attributeValues.push({
      field: 'coeff',
      selected: '',
      value: commonService.object.toNumber(coeff).toString(),
    });

  if (diagnosis)
    attributeValues.push({
      field: 'diagnosis',
      selected: diagnosis,
      value: diagnosis,
    });

  if (endOpts) {
    const option = commonService.object.toNumber(endOpts).toString();
    attributeValues.push({
      field: 'endOpts',
      selected: option,
      value: option,
    });
  }

  if (loadingSide)
    attributeValues.push({
      field: 'loadingSide',
      selected: loadingSide,
      value: loadingSide,
    });

  if (location)
    attributeValues.push({
      field: 'location',
      selected: location,
      value: location,
    });

  if (method)
    attributeValues.push({
      field: 'method',
      selected: method,
      value: method,
    });

  if (movDir)
    attributeValues.push({
      field: 'movDir',
      selected: movDir,
      value: movDir,
    });

  if (pattern)
    attributeValues.push({
      field: 'pattern',
      selected: pattern,
      value: pattern,
    });

  if (prescr)
    attributeValues.push({
      field: 'prescr',
      selected: prescr,
      value: prescr,
    });

  if (priority)
    attributeValues.push({
      field: 'priority',
      selected: priority,
      value: priority,
    });

  if (sportTask !== '\r')
    attributeValues.push({
      field: 'sportTask',
      selected: sportTask,
      value: sportTask,
    });

  if (!name || !componentSlug) {
    toast.error('Name and component slug are required.');
    return null;
  }

  return {
    id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: '',
    valuesObject: {},
    name,
    componentIds: [componentSlug],
    videoUrl,
    imageUrl,
    isUnilateral: commonService.object.toBoolean(isUnilateral),
    attributeValues: attributeValues.map((av) => ({
      ...av,
      id: '',
      exerciseId: '',
      ownerId: '',
      componentIds: [],
      isUnilateral: false,
    })),
  };
}

function getMuscleValuesFromCsvRow(
  row: string,
  exercises: Exercise[],
  headers: string[]
): CreateExerciseMuscleValues | null {
  const columns = row.split(',');
  if (columns.length !== 73) {
    toast.error(
      `Invalid row format. Expected 73 columns, got ${columns.length}.`
    );

    return null;
  }

  const [name, ...muscleLoads] = columns;

  const foundExercise = exercises.find((exercise) => exercise.name === name);

  if (!foundExercise) {
    toast.error(`Exercise not found: ${name}`);
    return null;
  }

  const muscleValues: AttributeValue[] = [];

  muscleLoads.forEach((load, i) => {
    if (load) {
      load = load
        .replace('\r', '')
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .trim();

      if (!load || !load.length) return;

      muscleValues.push(getMuscleValue(load, i + 1, headers));
    }
  });

  return {
    name,
    muscleValues,
  };
}
