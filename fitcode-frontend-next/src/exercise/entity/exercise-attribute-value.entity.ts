import { ExerciseAttribute } from '@/exercise/entity/exercise-attribute.entity';

export type ExerciseAttributeValue = {
  attributeId: string;
  attribute: ExerciseAttribute | null;
  exerciseId: string;
  value: any;
}