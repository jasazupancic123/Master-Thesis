import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class RemoveSetExercisesDto {
  @IsString({ each: true })
  @Expose()
  setExerciseIds: string[];
}