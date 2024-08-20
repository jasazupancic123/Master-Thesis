import { ExerciseEntity } from '../entity/exercise.entity';
import { OmitType } from '@nestjs/mapped-types';

export class CreateExerciseDto extends OmitType(ExerciseEntity, ['id', 'userId'] as const) {
}