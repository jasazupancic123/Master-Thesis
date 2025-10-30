import type { RefObject } from 'react';

import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
} from '@/core/exercise/constant/heatmap.const';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';

// normalize ids like `upper_pectoralis_major-l_3` → `upper_pectoralis_major-l`
export const normId = (id: string) => id.replace(/_\d+$/, '');

export const formatName = (id: string) =>
  id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const hasExplicitFill = (el: Element) => {
  const fill = el.getAttribute('fill');

  if (!fill) return false;
  return fill !== 'none';
};

export const findFilledGroup = (
  start: Element,
  heatmapLevel: number,
  maxHetmapLevel: number,
  muscleIds?: string[]
): SVGGraphicsElement | null => {
  let i = maxHetmapLevel + 1; // because first element is path, which we skip, so it becomes 3 when going to <g>'s

  let el: Element | null = start;

  while (el) {
    if (
      el instanceof SVGGraphicsElement &&
      el.tagName.toLowerCase() === 'g' &&
      (i === heatmapLevel ||
        [HEATMAP_FRONT_ID, HEATMAP_BACK_ID].includes(
          el.parentElement?.id || ''
        )) &&
      (muscleIds
        ? muscleIds.includes(normId(el.id).replace('-r', '').replace('-l', ''))
        : true)
    ) {
      return el;
    }

    el = el.parentElement;
    i--;
  }
  return null;
};

export const clearHideTimer = (hideTimer: RefObject<number | null>) => {
  if (hideTimer.current) {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }
};

export const computeCurrentAndPossibleExercises = (
  currentMuscle: Attribute,
  exercisesInComponent: TrainingExercise[],
  allExercises: Exercise[]
): {
  componentExercises: TrainingExercise[];
  possibleExercises: Exercise[];
} => {
  let componentExercises: TrainingExercise[] = [];
  let possibleExercises: Exercise[] = [];

  if (lib.common.tree.isLeaf(currentMuscle, 'options')) {
    componentExercises = exercisesInComponent.filter((exercise) =>
      exercise.exercise?.muscleValues?.some(
        (muscleValue) =>
          muscleValue.muscleId === currentMuscle.field &&
          core.exercise.muscle.getMuscleLoadSum(muscleValue) > 0
      )
    );

    possibleExercises = allExercises.filter((exercise) =>
      exercise.muscleValues?.some(
        (muscleValue) =>
          muscleValue.muscleId === currentMuscle.field &&
          core.exercise.muscle.getMuscleLoadSum(muscleValue) > 0 &&
          !componentExercises.find((e) => e.id === exercise.id)
      )
    );
  } else {
    const leafes = lib.common.tree.computeLeafes([currentMuscle], 'options');

    componentExercises = exercisesInComponent.filter((exercise) =>
      exercise.exercise?.muscleValues?.some((muscleValue) =>
        leafes.some((leaf) => muscleValue.muscleId === leaf.field)
      )
    );

    possibleExercises = allExercises.filter((exercise) =>
      exercise.muscleValues?.some((muscleValue) =>
        leafes.some(
          (leaf) =>
            muscleValue.muscleId === leaf.field &&
            !componentExercises.find((e) => e.id === exercise.id)
        )
      )
    );
  }

  return { componentExercises, possibleExercises };
};
