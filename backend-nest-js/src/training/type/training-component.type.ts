import { TrainingComponent } from '../entity/training-component.entity';
import { CreateTrainingSuperset } from './training-superset.type';

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'componentId' | 'color'
> & {
  supersets?: CreateTrainingSuperset[];
};
