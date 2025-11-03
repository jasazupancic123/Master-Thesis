import {
  DEFAULT_NUM_SETS_IN_EXERCISE,
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT,
  MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT,
} from '../const/training-limits.const';
import { MainSet } from '../enum/main-set.enum';
import type { ExerciseSetTracking } from '../type/exercise-set-tracking-state.type';
import type { Superset } from '../type/superset.type';
import type { Training } from '../type/training.type';
import type { TrainingExercise } from '../type/training-exercise.type';
import { core } from '@/core/core.service';
import {
  KG,
  REC_TIME,
  REPS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import type { Exercise } from '@/core/exercise/type/exercise.type';

export class TrainingSupersetUtil {
  toTrainingExercise(exercise: Exercise): TrainingExercise {
    const uni = exercise.isUnilateral || false;

    return {
      exercise,
      id: exercise.id,
      params: [],
      sets: Array.from({ length: DEFAULT_NUM_SETS_IN_EXERCISE }, (_, i) => ({
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
  }

  /**
   * Adds exercises to provided supersets.
   */
  addExercises(
    supersets: Superset[],
    exercises: TrainingExercise[],
    mainSet: MainSet
  ): void {
    if (supersets.length === 0) supersets.push({ exercises: [] });

    const maxSupersets =
      mainSet === MainSet.CIRCUIT
        ? MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT
        : MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT;

    const maxExercisesPerSuperset =
      mainSet === MainSet.CIRCUIT
        ? MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET
        : MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET;

    let i = 0;
    for (const superset of supersets) {
      while (
        superset.exercises.length < maxExercisesPerSuperset &&
        i < exercises.length
      ) {
        if (exercises[i]) superset.exercises.push({ ...exercises[i] });
        i++;
      }

      if (i === exercises.length)
        break; // stop if no exercises left
      else if (supersets.indexOf(superset) === supersets.length - 1) {
        // if this is the last superset, add a new one if there are still exercises to add
        if (supersets.length === maxSupersets) return;
        if (mainSet === MainSet.BLOCK) supersets.push({ exercises: [] });
      }
    }
  }

  removeExercise(
    supersets: Superset[],
    supersetIndex: number,
    exerciseIndex: number
  ): Superset[] {
    return supersets
      .map((s, i) =>
        i !== supersetIndex
          ? s
          : {
              ...s,
              exercises: s.exercises.filter((_, k) => k !== exerciseIndex),
            }
      )
      .filter((s) => s.exercises.length > 0);
  }

  updateExercise(
    newExercise: TrainingExercise,
    data: {
      training: Training;
      componentId: string;
      subgroupId?: string;
    }
  ): Superset[] {
    const component = data.training.components.find(
      (c) => c.id === data.componentId
    );

    if (!component) return [];

    const supersets = !data.subgroupId
      ? component.supersets
      : component.subgroups.find((sg) => sg.id === data.subgroupId)
          ?.supersets || [];

    for (const s of supersets)
      for (let i = 0; i < s.exercises.length; i++)
        if (s.exercises[i].id === newExercise.id) {
          s.exercises[i] = newExercise;
          break;
        }

    return supersets;
  }

  getUndoneExercises(
    superset: Superset,
    tracking: ExerciseSetTracking[]
  ): TrainingExercise[] {
    const undone: TrainingExercise[] = [];

    for (const e of superset.exercises) {
      const t = tracking.find((t) => t.exerciseId === e.id);
      for (const s of e.sets)
        if (
          !t ||
          (!t.completedSetNumbers.some((se) => se.setNumber === s.setNumber) &&
            !undone.find((u) => u.id === e.id))
        )
          undone.push(e);
    }

    return undone;
  }

  isEqual(a: Superset, b: Superset): boolean {
    if (a?.exercises?.length !== b?.exercises?.length) return false;

    for (let i = 0; i < a.exercises.length; i++) {
      const exerciseA = a.exercises[i];
      const exerciseB = b.exercises[i];
      if (exerciseA.id !== exerciseB.id) return false;

      for (let j = 0; j < exerciseA.sets.length; j++) {
        const setA = exerciseA.sets[j];
        const setB = exerciseB.sets[j];
        if (!setB || !core.training.set.isEqual(setA, setB)) return false;
      }
    }

    return true;
  }
}
