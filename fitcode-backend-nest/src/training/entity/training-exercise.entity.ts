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
import { TrainingWorkload } from './training-workload.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { TrainingSuperset } from './training-superset.entity';
import { IdEntity } from 'src/common/entity/id.entity';

export class TrainingExercise extends IdEntity {
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
}
