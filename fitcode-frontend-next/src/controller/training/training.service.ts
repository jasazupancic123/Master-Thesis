import { Component } from '../component/type/component.type';
import { Exercise } from '../exercise/type/exercise.type';
import { TrainingExercise } from './type/training-plan.type';
import { Training } from './type/training.type';

export class TrainingService {
  static mapComponents(item: Training, components: Component[]) {
    for (const componentId in item.components) {
      const trainingComponent = item.components[componentId];
      const found = components.find((c) => c.id === trainingComponent.id);
      if (found) trainingComponent.component = found;
    }
  }

  static mapExercises(item: Training, exercises: Exercise[]) {
    // populate exercises
    for (const componentId in item.components) {
      const trainingComponent = item.components[componentId];
      for (const superset of trainingComponent.supersets) {
        // sort exercises & convert to map
        const sorted: { [key: string]: TrainingExercise } = {};
        const trainingExercises = Object.entries(superset.exercises).map(
          ([_, e]) => e
        );

        trainingExercises.sort((a, b) => a.order - b.order);
        for (const e of trainingExercises) sorted[e.id] = e;
        superset.exercises = sorted;

        // map
        for (const exerciseId in superset.exercises) {
          const trainingExercise = superset.exercises[exerciseId];
          const found = exercises.find((e) => e.id === trainingExercise.id);
          if (found) trainingExercise.exercise = found;
        }
      }
    }
  }
}
