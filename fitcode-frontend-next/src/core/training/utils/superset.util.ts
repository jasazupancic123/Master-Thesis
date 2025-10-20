import { MainSet } from '../enum/main-set.enum';
import type { Superset } from '../type/superset.type';
import type { Training } from '../type/training.type';
import type { TrainingExercise } from '../type/training-exercise.type';
import {
  NUM_MAX_EXERCISES_PER_SUPERSET,
  NUM_MAX_SUPERSETS,
} from '@/components/trainer-group-day-view/constant/supersets.constant';
import { app } from '@/core/app.service';

export class TrainingSupersetUtil {
  addExercises(
    supersets: Superset[],
    exercises: TrainingExercise[],
    mainSet: MainSet
  ): void {
    if (supersets.length === 0) supersets.push({ exercises: [] });

    const maxSupersets = mainSet === MainSet.CIRCUIT ? 1 : NUM_MAX_SUPERSETS;
    const maxExercisesPerSuperset =
      mainSet === MainSet.CIRCUIT ? 32 : NUM_MAX_EXERCISES_PER_SUPERSET;

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
    exerciseIndex: number,
    supersetIndex: number
  ): Superset[] {
    return supersets
      .map((s, i) =>
        i !== supersetIndex
          ? s
          : {
              ...s,
              exercises: s.exercises.filter((ex, k) => k !== exerciseIndex),
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
          s.exercises[i] = structuredClone(newExercise);
          break;
        }

    return supersets;
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
        if (!setB || !app.training.set.isEqual(setA, setB)) return false;
      }
    }

    return true;
  }
}
