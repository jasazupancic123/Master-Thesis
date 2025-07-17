import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ColorEntity } from '@src/common/entity/color.entity';
import { IdEntity } from '@src/common/entity/id.entity';

import { PeriodizationType } from '../enum/periodization-type.enum';
import { Superset } from './superset.entity';
import { TrainingExerciseAverageStats } from './training-exercise-average-stats.entity';

export class Subgroup extends IntersectionType(IdEntity, ColorEntity) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the sub-training (at least 1)

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty()
  @Expose()
  supersets: Superset[];

  @ApiProperty({ enum: PeriodizationType, enumName: 'PeriodizationType' })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(PeriodizationType)
  @Expose()
  periodizationType?: PeriodizationType;

  @ValidateNested({ each: true })
  @Type(() => TrainingExerciseAverageStats)
  @ApiProperty()
  @Expose()
  futureStats: TrainingExerciseAverageStats[]; // average future workload stats
}
