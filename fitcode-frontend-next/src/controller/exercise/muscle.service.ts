import type { TrainingExercise } from '../training/type/training-exercise.type';

export class MuscleService {
  static generateMuscleLoads(
    exercises: TrainingExercise[],
    heatmapLevel: number
  ): [string, number][] {
    const loads: [string, number][] = [];

    exercises.forEach((exercise) => {
      if (!exercise.exercise || !exercise.exercise.muscleValues) return;

      exercise.exercise.muscleValues.forEach((muscleValue) => {
        let muscleId = undefined;

        if (heatmapLevel === 1) muscleId = muscleValue.field;
        else if (heatmapLevel >= 1 && heatmapLevel <= 3)
          muscleId = muscleValue.selected.split(':')[heatmapLevel - 2];

        if (!muscleId) return;

        const existingLoad = loads.find(([type]) => type === muscleId);
        if (existingLoad) {
          existingLoad[1] += Number(muscleValue.value);
        } else {
          loads.push([muscleId, Number(muscleValue.value)]);
        }
      });
    });

    return loads;
  }
}
