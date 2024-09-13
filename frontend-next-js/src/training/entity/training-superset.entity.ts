import { IdEntity } from '@/common/entity/id.entity';
import { TrainingExercise } from '@/training/entity/training-exercise.entity';

export type TrainingSuperset = IdEntity & {
  componentId: string;
  order: number;
  color: string;
  exercises: TrainingExercise[];
}