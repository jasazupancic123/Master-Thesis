import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { ExerciseSet } from './exercise-set.entity';

export class TrainingExercise extends IdEntity {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  params: string[]; // inferred from root component

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  methodId?: string;

  @ValidateNested({ each: true })
  @Type(() => ExerciseSet)
  @ApiProperty({ type: () => ExerciseSet, isArray: true })
  @Expose()
  sets: ExerciseSet[];
}
