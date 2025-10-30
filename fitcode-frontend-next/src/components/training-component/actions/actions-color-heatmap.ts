import { MUSCLE_LOAD_LEVELS } from '@/components/muscle-map-with-tooltip/constant/muscle-load-levels';
import {
  HEATMAP_COLORS,
  HEATMAP_EXERCISE_COUNT_COLORS,
} from '@/core/const/color.const';
import { core } from '@/core/core.service';
import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
  MIN_MUSCLES_FOR_REGION_ACTIVATION,
} from '@/core/exercise/constant/heatmap.const';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import type { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';

const getMuscleColorForAthlete = (load: number) => {
  let color = undefined;

  if (load > 0 && load <= 2) color = HEATMAP_COLORS[0];
  else if (load > 2 && load <= 4) color = HEATMAP_COLORS[1];
  else if (load > 4 && load <= 6) color = HEATMAP_COLORS[2];
  else if (load > 6 && load <= 8) color = HEATMAP_COLORS[3];
  else if (load > 8 && load <= 9) color = HEATMAP_COLORS[4];
  else if (load > 9) color = HEATMAP_COLORS[5];

  return color;
};

const getMuscleColorByRepIndex = (load: number, repLevelIndex: number) => {
  let color = undefined;

  const muscleLoadLevel = core.exercise.muscle.getMuscleLoadLevel(load);

  if (!muscleLoadLevel) return color;

  color = muscleLoadLevel.colors[repLevelIndex];

  return color;
};

export function paintHeatmaps(
  muscleLoads: [string, HeatmapLoad][] | [string, number][],
  selectedLoadType: 'ALL' | MuscleLoadType,
  exercisesInTraining?: TrainingExercise[],
  heatmapLevel?: number,
  maxHeatmapLevel?: number
) {
  // Limit to actual shapes
  const resetContainers = [HEATMAP_FRONT_ID, HEATMAP_BACK_ID];

  // Reset
  resetContainers.forEach((id) => {
    const container = document.getElementById(id);
    if (container) {
      container.querySelectorAll<HTMLElement>('*').forEach((el) => {
        el.style.setProperty('fill', 'transparent', 'important');
      });
    }
  });

  // Paint
  muscleLoads.forEach(([muscleId, muscleLoad]) => {
    const totalLoad =
      typeof muscleLoad === 'number'
        ? muscleLoad
        : selectedLoadType === MuscleLoadType.CONCENTRIC
          ? muscleLoad.concentric
          : selectedLoadType === MuscleLoadType.ECCENTRIC
            ? muscleLoad.eccentric
            : selectedLoadType === MuscleLoadType.ISOMETRIC
              ? muscleLoad.isometric
              : Math.max(muscleLoad.concentric, muscleLoad.eccentric);

    /*
      - For heatmap level <= 2 do number of exercises per region -> 1-3 is yellow, 4-6 orange, 7+ is red. To include an exercise in this count, 
        it needs affect at least 2 UNIQUE muscles per group (look uniques without -r and -l suffixes)
      - For heatmap level > 2 compute the repColorLevelIndexes, but it doesn't work for level 3 atm -> adjust it
    */

    let color: string | undefined | null = undefined;

    if (heatmapLevel && maxHeatmapLevel && exercisesInTraining) {
      // Trainer day view
      if (heatmapLevel <= maxHeatmapLevel / 2) {
        color = getMuscleColorByNumberExercises(
          muscleId,
          exercisesInTraining,
          heatmapLevel,
          maxHeatmapLevel,
          selectedLoadType
        );
      } else {
        const repColorIndex = getRepColorLevelIndexForMuscle(
          muscleId,
          exercisesInTraining,
          selectedLoadType,
          heatmapLevel,
          maxHeatmapLevel
        );

        if (repColorIndex === null) return;

        color = getMuscleColorByRepIndex(totalLoad, repColorIndex);
      }
    } else {
      // Athlete wellness view
      color = getMuscleColorForAthlete(totalLoad);
    }

    if (!color) return;

    // Find the actual shapes by id
    const elements = document.querySelectorAll<HTMLElement>(
      `[id="${muscleId}"]`
    );
    if (!elements.length) return;

    elements.forEach((el) => {
      // If your id is on a <g>, paint its children shapes
      const isGroup = el.tagName.toLowerCase() === 'g';
      const targets = isGroup ? el.querySelectorAll<HTMLElement>('*') : [el];

      targets.forEach((t) => {
        t.style.setProperty('fill', color, 'important');
      });
    });
  });

  /**
   * Get the color for a muscle based on the number of unique exercises affecting it in the training. It needs to affect at least MIN_MUSCLES_FOR_REGION_ACTIVATION unique muscles in the region to be considered activated.
   */
  function getMuscleColorByNumberExercises(
    muscleId: string,
    exercisesInTraining: TrainingExercise[],
    heatmapLevel: number,
    maxHeatmapLevel: number,
    selectedLoadType: MuscleLoadType | 'ALL'
  ): string | null {
    const uniqueExerciseIds = [] as string[];

    const muscleIds = [muscleId];

    const parent = core.exercise.muscle.getCorrectMuscleByLevel(
      muscleId,
      heatmapLevel,
      maxHeatmapLevel
    );

    if (!parent) return null;

    const leafes = lib.common.tree.computeLeafes([parent], 'options');

    leafes.forEach((option) => {
      if (!muscleIds.includes(option.field as string))
        muscleIds.push(option.field as string);
    });

    const uniqueActivatedMuscles = [] as string[]; // -r and -l are considered the same

    muscleIds.forEach((muscleId) => {
      exercisesInTraining.forEach((e) => {
        if (!e.exercise) return false;

        const foundMuscleValue = e.exercise.muscleValues?.find(
          (mv) => mv.muscleId === muscleId
        );

        if (!foundMuscleValue) return false;

        if (
          selectedLoadType === MuscleLoadType.ISOMETRIC
            ? foundMuscleValue.isometric
            : foundMuscleValue.concentric > 0 || foundMuscleValue.eccentric > 0
        ) {
          if (!uniqueExerciseIds.includes(e.id)) uniqueExerciseIds.push(e.id);

          const muscleBaseId = muscleId.replace(/-r$|-l$/i, '');
          if (!uniqueActivatedMuscles.includes(muscleBaseId))
            uniqueActivatedMuscles.push(muscleBaseId);
        }
      });
    });

    if (
      uniqueExerciseIds.length === 0 ||
      uniqueActivatedMuscles.length < MIN_MUSCLES_FOR_REGION_ACTIVATION
    )
      return null;

    const index =
      uniqueExerciseIds.length <= 3 ? 0 : uniqueExerciseIds.length <= 6 ? 1 : 2;

    return HEATMAP_EXERCISE_COUNT_COLORS[index];
  }

  /**
   * Get the rep color level index for a specific muscle, which affect the current muscle with muscleId. More reps means higher index, means more intense color.
   */
  function getRepColorLevelIndexForMuscle(
    muscleId: string,
    exercisesInTraining: TrainingExercise[],
    selectedMuscleLoad: MuscleLoadType | 'ALL',
    heatmapLevel: number,
    maxHeatmapLevel: number
  ): 0 | 1 | 2 | null {
    let maxLoad = 0;
    let repsCount = 0;

    const muscleIds = [muscleId];

    // If level is less than maxHeatmapLevel, we need to look find the corrent value of muscle region, not the direct muscle as if the heatmapLevel was max (4)
    if (heatmapLevel < maxHeatmapLevel) {
      const parent = core.exercise.muscle.getCorrectMuscleByLevel(
        muscleId,
        heatmapLevel,
        maxHeatmapLevel
      );

      if (parent) {
        const leafes = lib.common.tree.computeLeafes([parent], 'options');

        leafes.forEach((option) => {
          if (!muscleIds.includes(option.field as string))
            muscleIds.push(option.field as string);
        });
      }
    }

    muscleIds.forEach((muscleId) => {
      const activationExercises = exercisesInTraining.filter((e) => {
        if (!e.exercise) return false;

        const foundMuscleValue = e.exercise.muscleValues?.find(
          (mv) => mv.muscleId === muscleId
        );

        if (!foundMuscleValue) return false;

        if (
          selectedMuscleLoad === MuscleLoadType.ISOMETRIC &&
          foundMuscleValue.isometric > 0
        ) {
          maxLoad = Math.max(maxLoad, foundMuscleValue.isometric);

          return true;
        } else if (
          foundMuscleValue.concentric > 0 ||
          foundMuscleValue.eccentric > 0
        ) {
          maxLoad = Math.max(
            maxLoad,
            foundMuscleValue.concentric,
            foundMuscleValue.eccentric
          );

          return true;
        }

        return false;
      });

      if (!activationExercises.length) return;

      const maxColorLevel = MUSCLE_LOAD_LEVELS.find((level) => {
        return maxLoad >= level.min && maxLoad <= level.max;
      });

      if (!maxColorLevel) return;

      const exercisesInMaxColorLevel = activationExercises.filter((e) => {
        if (!e.exercise) return false;

        const foundMuscleValue = e.exercise.muscleValues?.find(
          (mv) => mv.muscleId === muscleId
        );

        if (!foundMuscleValue) return false;

        const load = core.exercise.muscle.getSelectedMuscleLoad(
          foundMuscleValue,
          selectedMuscleLoad
        );

        return load >= maxColorLevel.min && load <= maxColorLevel.max;
      });

      exercisesInMaxColorLevel.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.reps) repsCount += set.reps;
        });
      });
    });

    const levelIndex = repsCount < 20 ? 0 : repsCount < 40 ? 1 : 2;

    return levelIndex;
  }
}
