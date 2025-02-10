import { Component } from '../component/type/component.type';
import { Exercise } from '../exercise/type/exercise.type';
import { TrainingExercise } from './type/training-plan.type';
import { Training } from './type/training.type';

export class TrainingService {
  static mapComponents(item: Training, components: Component[]): Training {
    const mappedItem = { ...item };
    for (const componentId in mappedItem.components)
      mappedItem.components[componentId].component = components.find(
        (c) => c.id === componentId
      );

    return mappedItem;
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
