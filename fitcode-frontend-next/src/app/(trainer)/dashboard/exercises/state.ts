import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

import type { Component } from '@/core/component/type/component.type';
import { ExerciseController } from '@/core/exercise/exercise.controller';
import { ExerciseService } from '@/core/exercise/exercise.service';
import type {
  CreateExerciseMuscleValues,
  Exercise,
  UpsertManyExercises,
  UpsertManyMuscleValues,
} from '@/core/exercise/type/exercise.type';
import { lib } from '@/lib';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { DEFAULT_EXERCISE, EXERCISES_PAGE_SIZE } from '@/sites/exercises.page';

export function handlePaginateExercises(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: Partial<Record<keyof Exercise, any>>,
  state: {
    components: Component[];
    exercises: Exercise[];
    pagination: Pagination;
    setFilteredExercises: SetState<Exercise[]>;
    setPagination: SetState<Pagination>;
    search?: string;
  }
) {
  const {
    components,
    exercises,
    pagination,
    search,
    setFilteredExercises,
    setPagination,
  } = state;

  let filtered = ExerciseService.filter(exercises, filter, components);

  const total = filtered.length;

  // paginate
  const pages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const page = Math.min(Math.max(1, pagination.page), pages);

  filtered = lib.common.generic.paginate(filtered, {
    page,
    pageSize: pagination.pageSize,
    orderBy: { field: 'name', value: 'asc' },
  });

  // populate exercises
  filtered.map((exercise) =>
    ExerciseService.mapComponents(exercise, components)
  );

  setFilteredExercises(filtered);
  setPagination((prev) => ({
    ...prev,
    page,
    total,
    pages,
    pageSize: search && search.length ? Infinity : EXERCISES_PAGE_SIZE,
  }));
}

export async function handleAddExercise(
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

  const controller = ExerciseController.getInstance();
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
        disabled: input.disabled || false,
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
        return lib.common.tree.getRoot(component, components);
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

  const controller = ExerciseController.getInstance();

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
        disabled: input.disabled || false,
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
  exerciseId: string,
  state: {
    router: AppRouterInstance;
    setFilteredExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setFilteredExercises, setExercises } = state;
  const controller = ExerciseController.getInstance();

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
        case 'disabled':
          return value.toLowerCase() === 'true';
        case 'name':
        case 'imageUrl':
        case 'videoUrl':
        case 'instruction':
          return value === '' ? undefined : value;
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
          isUnilateral: e.prescriptions.some((p) =>
            p.toLowerCase().includes('uni')
          )
            ? true
            : false,
          disabled: e.disabled || false,
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
          params: [],
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

  Papa.parse<string[]>(file, {
    header: false,
    skipEmptyLines: true,
    error: (e: Error) => toast.error(`Failed to parse CSV file: ${e.message}`),
    complete: (results) => {
      const data = results.data as string[][];

      const headers = data[0].slice(1);

      const exercisesWithMuscleValues: (CreateExerciseMuscleValues | null)[] =
        data
          .slice(1)
          .filter((row) => row.length > 0 && row[0])
          .map((row) => {
            return getMuscleValuesFromCsvRow(row, exercises, headers);
          });

      const validImportedMuscleValues = exercisesWithMuscleValues.filter(
        (e) => e !== null
      ) as CreateExerciseMuscleValues[];

      setImportedMuscleValueExercises(validImportedMuscleValues);
    },
  });
}

export async function handleUpsertManyExercises(
  input: UpsertManyExercises,
  state: {
    router: AppRouterInstance;
    setAllExercises: SetState<Exercise[]>;
    setExercises: SetState<Exercise[]>;
    setFilteredExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises, setFilteredExercises, setAllExercises } = state;
  const controller = ExerciseController.getInstance();

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
  input: UpsertManyMuscleValues,
  state: {
    router: AppRouterInstance;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises } = state;
  const controller = ExerciseController.getInstance();

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

function getMuscleValuesFromCsvRow(
  row: string[],
  exercises: Exercise[],
  headers: string[]
): CreateExerciseMuscleValues | null {
  const [exerciseName, ...muscleLoads] = row;

  const exerciseValues: CreateExerciseMuscleValues = {
    name: exerciseName,
    muscleValues: [],
  };

  const foundExercise = exercises.find(
    (exercise) => exercise.name === exerciseName
  );

  if (!foundExercise) {
    toast.error(`Exercise not found: ${exerciseName}`);
    return null;
  }

  muscleLoads.forEach((loadsString, i) => {
    const muscleId = headers[i];

    if (loadsString) {
      loadsString = loadsString
        .replace('\r', '')
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .trim();

      if (!loadsString || !loadsString.length) return;

      const loads = loadsString.split(';').map((l) => l.trim());

      if (loads.length !== 3) {
        toast.error(
          `Invalid muscle load format for exercise ${muscleId} in column ${headers[i + 1]}. Expected 3 values, got ${loads.length}.`
        );
        return;
      }

      const numericLoads = loads.map((l) => Number(l));

      if (numericLoads.some((l) => isNaN(l))) {
        toast.error(
          `Invalid muscle load value for exercise ${muscleId} in column ${headers[i + 1]}. All values must be numeric.`
        );
        return;
      }

      if (!exerciseValues.muscleValues) exerciseValues.muscleValues = [];

      exerciseValues.muscleValues.push({
        muscleId,
        concentric: numericLoads[2],
        isometric: numericLoads[1],
        eccentric: numericLoads[0],
      });
    }
  });

  return exerciseValues;
}
