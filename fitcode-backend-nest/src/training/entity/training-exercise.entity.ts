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
import { ExerciseMeta } from './exercise-meta.entity';
import { UserWorkload } from './user-workload.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { Superset } from './superset.entity';
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
  @Type(() => ExerciseMeta)
  @ApiProperty()
  @Expose()
  meta: ExerciseMeta;
}
