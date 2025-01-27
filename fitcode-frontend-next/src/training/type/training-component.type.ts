import { TrainingComponent } from '@/training/entity/training-component.entity';

export type CreateTrainingComponent = Pick<TrainingComponent, 'componentId'>

export type UpdateTrainingComponent = Partial<CreateTrainingComponent>