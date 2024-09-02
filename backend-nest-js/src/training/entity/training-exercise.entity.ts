import { IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TrainingExerciseMeta } from './training-exercise-meta.entity';
import { TrainingExerciseUserData } from './training-exercise-user-data.entity';

export class TrainingExercise {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  order: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  color: string;

  @ValidateNested()
  @Type(() => TrainingExerciseMeta)
  @ApiProperty()
  @Expose()
  meta: TrainingExerciseMeta;

  @ValidateNested({ each: true })
  @Type(() => TrainingExerciseUserData)
  @ApiProperty()
  @Expose()
  data: TrainingExerciseUserData[];
}