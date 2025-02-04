import { TrainingComponent } from '../entity/training-component.entity';

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'order' | 'color' | 'supersets'
>;

export type UpdateTrainingComponent = Partial<CreateTrainingComponent>;
