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
    let loads: [string, HeatmapLoad][] = [];

    const muscleIdCounter: { [muscleId: string]: number } = {};

    exercises.forEach((exercise) => {
      if (!exercise.exercise || !exercise.exercise.muscleValues) return;

      exercise.exercise.muscleValues.forEach((muscleValue) => {
        if (
          muscleValue.eccentric === 0 &&
          muscleValue.isometric === 0 &&
          muscleValue.concentric === 0
        )
          return;

        let muscleId = muscleValue.muscleId;

        const existingLoad = loads.find(([type]) => type === muscleId);

        if (existingLoad) {
          existingLoad[1].eccentric += Number(muscleValue.eccentric || 0);
          existingLoad[1].isometric += Number(muscleValue.isometric || 0);
          existingLoad[1].concentric += Number(muscleValue.concentric || 0);

          muscleIdCounter[muscleId] = (muscleIdCounter[muscleId] || 0) + 1;
        } else {
          loads.push([
            muscleId,
            {
              eccentric: Number(muscleValue.eccentric || 0),
              isometric: Number(muscleValue.isometric || 0),
              concentric: Number(muscleValue.concentric || 0),
            },
          ]);

          muscleIdCounter[muscleId] = 1;
        }
      });
    });

    // Average loads
    loads = loads.map(([muscleId, load]) => {
      const count = muscleIdCounter[muscleId] || 1;
      return [
        muscleId,
        {
          eccentric: Math.round(load.eccentric / count),
          isometric: Math.round(load.isometric / count),
          concentric: Math.round(load.concentric / count),
        },
      ];
    });

    // Fill missing muscles with 0 load
    const leafChildren = this.computeLeafMuscleIds(MUSCLES_TREE);

    leafChildren.forEach((muscleId) => {
      if (!loads.find(([type]) => type === muscleId)) {
        loads.push([
          muscleId,
          {
            eccentric: 0,
            isometric: 0,
            concentric: 0,
          },
        ]);
      }
    });

    const parents: Attribute[] = [];

    // Compute parents depending on level
    loads.forEach(([muscleId]) => {
      const parent = this.getCorrectMuscleByLevel(
        muscleId,
        heatmapLevel,
        maxHeatmapLevel
      );

      if (parent && !parents.includes(parent)) parents.push(parent);
    });

    // Calculate averages for parents
    for (const parent of parents) {
      const childrenIds = this.computeLeafMuscleIds([parent]);

      const muscleLoads = loads.filter(
        (load) =>
          childrenIds.includes(load[0]) &&
          load[1].concentric + load[1].isometric + load[1].eccentric > 0
      );

      const count = muscleLoads.length;

      let totalEccentric = Math.round(
        muscleLoads.reduce((sum, [, load]) => sum + load.eccentric, 0) / count
      );

      let totalIsometric = Math.round(
        muscleLoads.reduce((sum, [, load]) => sum + load.isometric, 0) / count
      );

      let totalConcentric = Math.round(
        muscleLoads.reduce((sum, [, load]) => sum + load.concentric, 0) / count
      );

      loads = loads.map((load) => {
        if (!childrenIds.includes(load[0])) return load;

        return [
          load[0],
          {
            eccentric: totalEccentric,
            isometric: totalIsometric,
            concentric: totalConcentric,
          },
        ];
      });
    }

    return loads;
  }

  /**
   * Returns the max heatmap level based on the muscles tree depth
   */
  getMaxHeatmapLevel(muscleLoads: [string, HeatmapLoad][]) {
    let level = 0;

    const parents = this.getParents();

    muscleLoads.forEach((ml) => {
      let currentLevel = 0;

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

  getCorrectMuscleByLevel(
    muscleId: string,
    level: number,
    maxLevel: number
  ): Attribute | undefined {
    if (level === maxLevel) {
      const leafes = this.computeLeafMuscles(MUSCLES_TREE);
      return leafes.find((m) => m.field === muscleId);
    }

    const parents = this.getParents();

    let parent = parents.find((p) =>
      p.options?.find((o) => o.field === muscleId)
    );

    if (!parent) return undefined;

    let levelsToClimb = maxLevel - level;

    while (levelsToClimb > 0 && parent) {
      levelsToClimb--;
      muscleId = parent.field as string;
      const potentialParent = parents.find((p) =>
        p.options?.find((o) => o.field === muscleId)
      );

      if (!potentialParent) break;
      parent = potentialParent;
    }

    return parent;
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

  computeLeafMuscles(root: Attribute[]): Attribute[] {
    const leafes = [] as Attribute[];

    root.forEach((muscle) => {
      let leaf = muscle;

      if (!leaf.options) {
        leafes.push(leaf);
        return;
      }

      const optionsToEval = [...leaf.options];

      while (optionsToEval.length) {
        const option = optionsToEval.shift();

        if (!option) continue;

        if (option.options) {
          optionsToEval.push(...option.options);
        } else {
          leafes.push(option);
        }
      }
    });

    return leafes;
  }

  computeLeafMuscleIds(root: Attribute[]): string[] {
    const leafes = [] as string[];

    root.forEach((muscle) => {
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
