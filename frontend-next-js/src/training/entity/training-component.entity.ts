import { Component } from '@/component/type/component.type';
import { TrainingExercise } from './training-exercise.entity';

export type TrainingComponent = {
  componentId: string;
  component: Component | null;
  order: number;
  color: string;
  exercises: TrainingExercise[];
}