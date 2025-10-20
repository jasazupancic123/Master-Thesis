import type { TrainingExercise } from '../../training/type/training-exercise.type';
import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
} from '@/core/exercise/constant/heatmap.const';

export class MuscleUtil {
  generateLoads(
    exercises: TrainingExercise[],
    heatmapLevel: number
  ): [string, number][] {
    const loads: [string, number][] = [];

    exercises.forEach((exercise) => {
      if (!exercise.exercise || !exercise.exercise.muscleValues) return;

      exercise.exercise.muscleValues.forEach((muscleValue) => {
        let muscleId: string | undefined = undefined;

        if (heatmapLevel === 1) muscleId = muscleValue.field as string;
        else if (heatmapLevel >= 1 && heatmapLevel <= 3)
          muscleId = muscleValue.selected?.split(':')?.[heatmapLevel - 2];

        if (!muscleId) return;

        const existingLoad = loads.find(([type]) => type === muscleId);
        if (existingLoad) existingLoad[1] += Number(muscleValue.value);
        else loads.push([muscleId, Number(muscleValue.value)]);
      });
    });

    return loads;
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
}
