import { TrainingSuperset } from '@/training/entity/training-superset.entity';

export type CreateTrainingSuperset = Partial<Pick<TrainingSuperset, 'order' | 'color' | 'exercises'>>

export type UpdateTrainingSuperset = Partial<Pick<TrainingSuperset, 'order' | 'color'>>