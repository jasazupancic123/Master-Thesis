import { ExerciseDto } from './exercise.dto';
import { OmitType } from '@nestjs/mapped-types';

export class CreateExerciseDto extends OmitType(ExerciseDto, ['id', 'userId'] as const) {}