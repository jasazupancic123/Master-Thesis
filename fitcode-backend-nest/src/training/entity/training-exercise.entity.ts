import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TrainingExerciseMeta } from './training-exercise-meta.entity';
import { TrainingExerciseUserData } from './training-exercise-user-data.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { TrainingSuperset } from './training-superset.entity';

export class TrainingExercise {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;
  exercise?: Exercise;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  order?: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

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

  superset?: TrainingSuperset;
}
