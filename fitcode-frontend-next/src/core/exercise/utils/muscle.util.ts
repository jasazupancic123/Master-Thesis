import type { TrainingExercise } from '../../training/type/training-exercise.type';
import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
} from '@/core/exercise/constant/heatmap.const';
import { HeatmapLoad } from '../type/heatmap-load.entity';
import { MUSCLES_TREE } from '../constant/muscles-tree.constant';
import { Attribute } from '@/core/attribute/type/attribute.type';

export class MuscleUtil {
  generateLoads(
    exercises: TrainingExercise[],
    heatmapLevel: number,
    maxHeatmapLevel: number
  ): [string, HeatmapLoad][] {
    console.log('GENERATE LOADS');
    const loads: [string, HeatmapLoad][] = [];

    exercises.forEach((exercise) => {
      if (!exercise.exercise || !exercise.exercise.muscleValues) return;

      exercise.exercise.muscleValues.forEach((muscleValue) => {
        let muscleId = muscleValue.muscleId;

        const existingLoad = loads.find(([type]) => type === muscleId);
        if (existingLoad) {
          existingLoad[1].eccentric += Number(muscleValue.eccentric || 0);
          existingLoad[1].isometric += Number(muscleValue.isometric || 0);
          existingLoad[1].concentric += Number(muscleValue.concentric || 0);
          return;
        } else
          loads.push([
            muscleId,
            {
              eccentric: Number(muscleValue.eccentric || 0),
              isometric: Number(muscleValue.isometric || 0),
              concentric: Number(muscleValue.concentric || 0),
            },
          ]);
      });
    });

    console.log(
      'heatmapLevel',
      heatmapLevel,
      'maxHeatmapLevel',
      maxHeatmapLevel
    );

    if (heatmapLevel === maxHeatmapLevel) return loads; // no need to run through muscle tree

    const allParents = this.getParents();

    const parents: Attribute[] = [];

    console.log('loads345', loads);

    loads.forEach(([muscleId]) => {
      let levelsToClimb = maxHeatmapLevel - heatmapLevel; // 1

      let parent = allParents.find((p) =>
        p.options?.find((o) => o.field === muscleId)
      );

      console.log(
        'levelsToClimb',
        levelsToClimb,
        'parent',
        parent,
        'muscleId',
        muscleId
      );

      if (!parent) return;

      while (levelsToClimb > 0 && parent) {
        console.log('levelsToClimb', levelsToClimb);
        levelsToClimb--;
        muscleId = parent.field as string;

        const potentialParent = allParents.find((p) =>
          p.options?.find((o) => o.field === muscleId)
        );

        if (!potentialParent) break;

        parent = potentialParent;
      }

      if (parent && !parents.includes(parent)) parents.push(parent);
    });

    console.log('parents123', parents);

    return loads;
  }
  /**
   * Returns the max heatmap level based on the muscles tree depth
   */
  getHeatmapLevel(muscleLoads: [string, HeatmapLoad][]) {
    let level = 1;

    const parents = this.getParents();

    muscleLoads.forEach((ml) => {
      let currentLevel = 1;

      let parent = parents.find((p) =>
        p.options?.find((o) => o.field === ml[0])
      );

      if (!parent) return;

      currentLevel = currentLevel + 1;

      while (parent) {
        parent = parents.find((p) =>
          p.options?.find((o) => o.field === parent?.field)
        );

        if (parent) currentLevel++;
      }

      if (currentLevel > level) level = currentLevel;
    });

    return level;
  }

  /**
   * Returns all muscles who have children (options array)
   */
  getParents(): Attribute[] {
    const musclesToEval: Attribute[] = MUSCLES_TREE.map((m) => m);
    const parents: Attribute[] = [];

    while (musclesToEval.length) {
      const muscle = musclesToEval?.shift();

      if (!muscle) continue;

      if (muscle.options && muscle.options.length) {
        parents.push(muscle);
        musclesToEval.push(...muscle.options);
      }
    }

    return parents;
  }

  /**
   * Generate empty muscle loads for all muscles at given depth
   */
  generateEmptyLoads(childrenDepth: number): [string, number][] {
    const loads: [string, number][] = [];
    const resetContainers = [HEATMAP_FRONT_ID, HEATMAP_BACK_ID];

    // reset
    const muscleIds = [] as string[];
    resetContainers.forEach((id) => {
      const container = document.getElementById(id);
      if (container) {
        let ids = this.getIdsAtDepth(container, childrenDepth);
        ids = ids.filter((id) => !muscleIds.includes(id));
        muscleIds.push(...ids);
      }
    });

    muscleIds.forEach((id) => loads.push([id, 0]));
    return loads;
  }

  private getIdsAtDepth(root: Element, depth: number): string[] {
    let level: Element[] = Array.from(root.children); // depth = 1
    for (let d = 1; d < depth; d++)
      level = level.flatMap((el) => Array.from(el.children));

    return level
      .map((el) => (el as HTMLElement).id)
      .filter((id): id is string => Boolean(id));
  }

  computeLeafMuscleIds(): string[] {
    const leafes = [] as string[];

    MUSCLES_TREE.forEach((muscle) => {
      let leaf = muscle;

      if (!leaf.options) {
        leafes.push(leaf.field as string);
        return;
      }

      const optionsToEval = [...leaf.options];

      while (optionsToEval.length) {
        const option = optionsToEval.shift();

        if (!option) continue;

        if (option.options) {
          optionsToEval.push(...option.options);
        } else {
          leafes.push(option.field as string);
        }
      }
    });

    return leafes;
  }
}
