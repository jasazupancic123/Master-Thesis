import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import type { SetState } from '@/lib/common/type/state.type';
import {
  KG,
  REC_TIME,
  REPS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Method } from '@/core/method/type/method.type';
import { SubgroupUtil } from '@/core/training/custom-shit-subgroup.util';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { TrainerDayViewCtxExtended } from '@/store/trainer-day-view.provider';

export function getTrainingExercisesFromExercises(
  exercisesIdsToAdd: string[],
  allExercises: Exercise[],
  component: TrainingComponent,
  method?: Method,
  minSets?: number,
  maxSets?: number
): TrainingExercise[] {
  return exercisesIdsToAdd.map((id) => {
    const exercise = allExercises.find((e) => e.id === id);
    const uni = exercise?.isUnilateral || false;

    const setsNumber =
      minSets !== undefined && maxSets !== undefined
        ? Math.floor((minSets + maxSets) / 2)
        : minSets || maxSets || 3;

    return {
      id,
      exercise,
      periodized: false,
      attributes: component?.method?.attributes || [],
      params: [],
      sets: Array.from({ length: setsNumber }, (_, i) => ({
        setNumber: i + 1,
        reps: REPS.defaultValue as number,
        ...(uni && { repsR: REPS.defaultValue as number }),
        loadKg: KG.defaultValue as number,
        ...(uni && { loadKgR: KG.defaultValue as number }),
        tempo: TEMPO.defaultValue as string,
        ...(uni && { tempoR: TEMPO.defaultValue as string }),
        recTime: REC_TIME.defaultValue as number,
      })),
    };
  });
}

export function handleAddExerciseToSupersetComponent(
  input: {
    selectedExercisesIds: string[];
    allExercises: Exercise[];
    minSets: number | undefined;
    maxSets: number | undefined;
    setSearch: SetState<string>;
    setOpenAddExerciseModal: SetState<boolean>;
  },
  context: {
    useGroup: IGroupCtx;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
  }
) {
  const {
    selectedExercisesIds,
    allExercises,
    minSets,
    maxSets,
    setOpenAddExerciseModal,
  } = input;

  const { useGroup, useTrainerDayViewContext } = context;

  const { setTrainings, setDetectedChanges } = useGroup;

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSearch,
    supersets: supersetsState,
    setSelectedSubgroup,
    setPagination,
  } = useTrainerDayViewContext;

  if (selectedSubgroup?.parentId) return;

  setSearch('');
  setPagination((prev) => ({
    ...prev,
    page: 1,
  }));

  // get only new exercises
  const exercisesIdsToAdd =
    supersetsState && supersetsState.length
      ? [...selectedExercisesIds].filter(
          (id) =>
            !supersetsState
              .map((s) => s.exercises.map((e) => e.id))
              .flat()
              .includes(id)
        )
      : selectedExercisesIds;

  const method = component?.method;
  const exercisesToAdd = getTrainingExercisesFromExercises(
    exercisesIdsToAdd,
    allExercises,
    component,
    method,
    minSets,
    maxSets
  );

  if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
    // handle warmup or cooldown component, don't update prescribed stats
    const wOrC =
      component.id === WARMUP_ID
        ? { ...training.warmup }
        : { ...training.cooldown };

    const oldSupersets = !selectedSubgroup
      ? wOrC.supersets
      : selectedSubgroup?.supersets;

    const supersets = updateSupersets(
      oldSupersets,
      [...exercisesToAdd],
      wOrC.mainSet
    );

    if (!supersets) return;

    const updatedWOrC = {
      ...wOrC,
    };
    if (!selectedSubgroup) updatedWOrC.supersets = [...supersets];
    else {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: [...supersets],
      };

      const updatedSubgroups = [
        ...component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      ];

      updatedWOrC.subgroups = updatedSubgroups;
    }

    updatedWOrC.subgroups = SubgroupUtil.addExercises(
      updatedWOrC,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    const updatedTraining =
      component.id === WARMUP_ID
        ? { ...training, warmup: updatedWOrC }
        : { ...training, cooldown: updatedWOrC };

    setComponent(updatedWOrC);
    setTraining(updatedTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );
    setOpenAddExerciseModal(false);
    setDetectedChanges(true);
    return;
  }

  // get training component index
  const trainingComponentIndex = [...training.components].findIndex(
    (c) => c.id === component.id
  );

  // last superset index
  const oldSupersets = selectedSubgroup?.supersets
    ? [...selectedSubgroup.supersets]
    : component
      ? component.supersets
      : training.components[trainingComponentIndex]?.supersets
        ? [...training.components[trainingComponentIndex].supersets]
        : [];

  const supersets = updateSupersets(
    oldSupersets,
    [...exercisesToAdd],
    (selectedSubgroup || component).mainSet
  );

  if (!supersets) return;

  const updatedComponents = [...training.components];
  if (!selectedSubgroup) {
    // update training component's supersets
    const updatedComponent = {
      ...updatedComponents[trainingComponentIndex],
      supersets: [...supersets],
    };

    updatedComponent.subgroups = SubgroupUtil.addExercises(
      updatedComponent,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    updatedComponents[trainingComponentIndex] = { ...updatedComponent };

    const newTraining: Training = {
      ...training,
      components: updatedComponents,
    };

    setComponent(updatedComponent);
    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === newTraining.id ? newTraining : t))
    );
    setDetectedChanges(true);
    setOpenAddExerciseModal(false);
  } else {
    // update subgroup's supersets
    const updatedSubgroup = {
      ...selectedSubgroup,
      supersets: [...supersets],
    };

    const updatedSubgroups = [
      ...component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    ];

    const updatedComponents = [...training.components];

    const updatedComponent = {
      ...updatedComponents[trainingComponentIndex],
      subgroups: updatedSubgroups,
    };

    updatedComponent.subgroups = SubgroupUtil.addExercises(
      updatedComponent,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    updatedComponents[trainingComponentIndex] = { ...updatedComponent };

    const newTraining: Training = {
      ...training,
      components: updatedComponents,
    };

    setComponent(updatedComponent);
    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === newTraining.id ? newTraining : t))
    );
    setDetectedChanges(true);
    setOpenAddExerciseModal(false);

    setDetectedChanges(true);
    setOpenAddExerciseModal(false);
    setSelectedSubgroup(updatedSubgroup);
  }
}
