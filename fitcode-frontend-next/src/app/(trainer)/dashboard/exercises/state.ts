import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

import { CommonService } from '@/common/service/common.service';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
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
import { DEFAULT_EXERCISE } from '@/sites/exercises.page';

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
    ExerciseService.mapComponents(exercise, components)
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
      muscleValues: boolean;
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

  const controller = ExerciseController.getInstance(token);

  if (!input.name) return toast.error('Name is required');
  if (!input.componentIds?.length)
    return toast.error('Select at least one component to add');

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
        categories: input.categories || [],
        equipment: input.equipment || [],
        prescriptions: input.prescriptions || [],
        patterns: input.patterns || [],
        bodyRegions: input.bodyRegions || [],
        loadingSides: input.loadingSides || [],
        movementDirections: input.movementDirections || [],
        locations: input.locations || [],
        liftPriorities: input.liftPriorities || [],
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
      muscleValues: boolean;
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

  const controller = ExerciseController.getInstance(token);

  if (!input.name) return toast.error('Name is required');
  if (!input.componentIds?.length)
    return toast.error('Select at least one component to add');

  handleApiRequest(
    router,
    () =>
      controller.update(exerciseId, {
        name: input.name!,
        componentIds: input.componentIds!,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction,
        categories: input.categories || [],
        equipment: input.equipment || [],
        prescriptions: input.prescriptions || [],
        patterns: input.patterns || [],
        bodyRegions: input.bodyRegions || [],
        loadingSides: input.loadingSides || [],
        movementDirections: input.movementDirections || [],
        locations: input.locations || [],
        liftPriorities: input.liftPriorities || [],
      }),
    (exercise) => {
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

  Papa.parse<Exercise>(file, {
    header: true,
    skipEmptyLines: true,
    error: (e: Error) => toast.error(`Failed to parse CSV file: ${e.message}`),
    transform: (value, column) => {
      switch (column) {
        case 'imageUrl':
        case 'videoUrl':
        case 'instruction':
          return value === '' ? undefined : value;
        case 'isUnilateral':
          return value.toLowerCase() === 'true';
        case 'componentIds':
        case 'categories':
        case 'prescriptions':
        case 'patterns':
        case 'bodyRegions':
        case 'equipment':
        case 'loadingSides':
        case 'locations':
        case 'liftPriorities':
        case 'movementDirections':
          const array = value.split(',').map((v) => v.trim());
          return array.every((v) => v === '') ? [] : array;
        default:
          return value;
      }
    },
    complete: ({ data }) => {
      setImportedExercises(
        data.map((e) => ({
          id: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: '',
          name: e.name || '',
          componentIds: e.componentIds.map((id) => {
            // component ids are separated by :, we need only last part
            const parts = id.split(':').map((p) => p.trim());
            return parts[parts.length - 1];
          }),
          isUnilateral: e.isUnilateral || false,
          imageUrl: e.imageUrl,
          videoUrl: e.videoUrl,
          instruction: e.instruction,
          categories: e.categories || [],
          equipment: e.equipment || [],
          prescriptions: e.prescriptions || [],
          patterns: e.patterns || [],
          bodyRegions: e.bodyRegions || [],
          loadingSides: e.loadingSides || [],
          movementDirections: e.movementDirections || [],
          locations: e.locations || [],
          liftPriorities: e.liftPriorities || [],
        }))
      );
    },
  });
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
    setAllExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setFilteredExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises, setFilteredExercises, setAllExercises } = state;
  const controller = ExerciseController.getInstance(token);

  handleApiRequest(
    router,
    () => controller.upsertMany(input),
    (exercises) => {
      const updateExercisesFn = (prev: Exercise[]) => {
        const filtered = prev.filter(
          (e) => !exercises.find((newE) => newE.name === e.name)
        );
        return [...filtered, ...exercises];
      };

      setExercises(updateExercisesFn);
      setFilteredExercises(updateExercisesFn);
      setAllExercises(updateExercisesFn);

      toast.success(`Successfully imported ${exercises.length} exercises!`);
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

  return { field, selected, value };
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
