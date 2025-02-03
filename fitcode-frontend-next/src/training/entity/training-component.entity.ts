import { Component } from '@/component/entity/component.entity';
import { TrainingSuperset } from '@/training/entity/training-superset.entity';

export type TrainingComponent = {
  id: string;
  component: Component | null;
  order: number;
  color?: string;
  supersets: TrainingSuperset[];
};
