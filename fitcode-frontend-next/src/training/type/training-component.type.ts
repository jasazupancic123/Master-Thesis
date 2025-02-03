import { TrainingComponent } from '@/training/entity/training-component.entity';

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'color' | 'order'
>;

export type UpdateTrainingComponent = Partial<CreateTrainingComponent>;
