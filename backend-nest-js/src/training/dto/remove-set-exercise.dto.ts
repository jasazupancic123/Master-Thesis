import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class RemoveSetExercisesDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  trainingId: string;

  @IsString({ each: true })
  @Expose()
  setExerciseIds: string[];
}