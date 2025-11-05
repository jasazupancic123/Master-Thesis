import {
  DEFAULT_NUM_SETS_IN_EXERCISE,
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS,
} from '../const/training-limits.const';
import { MainSet } from '../enum/main-set.enum';
import type {
  ExerciseMainParamField,
  ExerciseParamField,
  ExerciseSet,
} from '../type/exercise-set.type';
import type { ExerciseSetTracking } from '../type/exercise-set-tracking-state.type';
import type { Superset } from '../type/superset.type';
import type { Training } from '../type/training.type';
import type { TrainingExercise } from '../type/training-exercise.type';
import { core } from '@/core/core.service';
import {
  KG,
  REC_TIME,
  REPS,
  TEMPO_CON,
  TEMPO_ECC,
  TEMPO_IDLE,
  TEMPO_ISO,
} from '@/core/exercise/constant/exercise-param.constant';
import { Methods } from '@/core/exercise/constant/method.constant';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Method } from '@/core/exercise/type/method.type';

export class TrainingSupersetUtil {
  toTrainingExercise(exercise: Exercise): TrainingExercise {
    const uni = exercise.isUnilateral || false;

    return {
      exercise,
      id: exercise.id,
      sets: Array.from({ length: DEFAULT_NUM_SETS_IN_EXERCISE }, (_, i) => ({
        setNumber: i + 1,
        reps: REPS.defaultValue as number,
        ...(uni && { repsR: REPS.defaultValue as number }),
        loadKg: KG.defaultValue as number,
        ...(uni && { loadKgR: KG.defaultValue as number }),
        tempoEcc: TEMPO_ECC.defaultValue as number,
        ...(uni && { tempoEccR: TEMPO_ECC.defaultValue as number }),
        tempoIso: TEMPO_ISO.defaultValue as number,
        ...(uni && { tempoIsoR: TEMPO_ECC.defaultValue as number }),
        tempoCon: TEMPO_CON.defaultValue as number,
        ...(uni && { tempoConR: TEMPO_ECC.defaultValue as number }),
        tempoIdle: TEMPO_IDLE.defaultValue as number,
        ...(uni && { tempoIdleR: TEMPO_ECC.defaultValue as number }),
        recTime: REC_TIME.defaultValue as number,
        ...(uni && { recTimeR: REC_TIME.defaultValue as number }),
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
    if (supersets.length === 0) supersets.push({ exercises: [], mainSet });

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
        if (supersets.length === MAX_NUM_SUPERSETS) return;
        supersets.push({ exercises: [], mainSet });
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
          // s.exercises[i] = newExercise;
          const method = Methods.find((m) => m.field === newExercise.methodId);
          if (newExercise.methodId && method)
            s.exercises[i] = this.applyMethod(method, newExercise);
          else s.exercises[i] = newExercise;

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

  applyMethodToExercises(
    method: Method,
    supersets: Superset[],
    selectedExercises: Exercise[]
  ): void {
    for (const superset of supersets) {
      for (let i = 0; i < superset.exercises.length; i++) {
        const exercise = superset.exercises[i];
        const isSelected = selectedExercises.find((e) => e.id === exercise.id);
        if (isSelected)
          superset.exercises[i] = this.applyMethod(method, exercise);
      }
    }
  }

  /**
   * Applies method constraints (min, max, disabled, pattern) to the exercise.
   * Clamps values that exceed limits and removes invalid params.
   */
  applyMethod(
    method: Method,
    trainingExercise: TrainingExercise
  ): TrainingExercise {
    trainingExercise.methodId = method.field as string;
    const updated = structuredClone(trainingExercise);

    for (const attr of method.attributes) {
      if (attr.field === 'sets') {
        const sets = updated.sets.length;
        if (attr.min && sets < attr.min) {
          // add missing sets
          for (let i = sets; i < attr.min; i++) {
            const newSet = structuredClone(updated.sets[0]);
            newSet.setNumber = i + 1;
            updated.sets.push(newSet);
          }
        }

        if (attr.max && sets > attr.max)
          updated.sets = updated.sets.slice(0, attr.max);

        continue;
      }

      const isUnilateral = trainingExercise.exercise?.isUnilateral ?? false;
      for (const set of updated.sets) {
        const fields = [
          attr.field,
          ...(isUnilateral ? [core.exercise.param.pairs[attr.field]] : []),
        ];

        for (const field of fields) {
          let value = set[field];
          if (value === null || value === undefined) continue;

          // clamp numeric values
          if (typeof value === 'number') {
            const min = typeof attr.min === 'number' ? attr.min : 0;
            const max = typeof attr.max === 'number' ? attr.max : Infinity;
            if (value < min) value = min;
            if (value > max) value = max;
          }

          // disable field
          if (attr.disabled) {
            value = undefined;
            set[field] = value as never;

            // find another param in the same "option" group to set new default value
            const alternative = this.findAlternativeMethodParam(
              method,
              field as ExerciseMainParamField
            );

            if (alternative)
              set[alternative.field as keyof ExerciseSet] =
                alternative.value as never;
          } else set[field] = value as never;
        }
      }
    }

    return updated;
  }

  findAlternativeMethodParam(
    method: Method,
    field: ExerciseMainParamField
  ): { field: ExerciseMainParamField; value: number | string } | undefined {
    // get all params in the same option group, excluding the provided field
    // for example, if field is "reps", get ["time", "dist"], because they
    // belong to the same option group (volume)
    const optionGroup = core.exercise.param
      .getOptionGroup(field)
      .filter((p) => p !== field);

    // get first non-disabled param from the method attributes
    for (const param of optionGroup) {
      const methodAttribute = method.attributes.find((a) => a.field === param);
      if (methodAttribute && !methodAttribute.disabled) {
        const attribute = core.exercise.param.get(param as ExerciseParamField);
        if (attribute) {
          // check if method applies any constraints to the alternative param and clap
          // set default value accordingly
          let value: number | string = attribute.defaultValue as
            | number
            | string;

          if (typeof value === 'number') {
            const min =
              typeof methodAttribute.min === 'number' ? methodAttribute.min : 0;
            const max =
              typeof methodAttribute.max === 'number'
                ? methodAttribute.max
                : Infinity;

            if (value < min) value = min;
            if (value > max) value = max;
          }

          return { field: param as ExerciseMainParamField, value };
        }
      }
    }
  }
}
