import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { ExerciseMainParamField } from '@src/training/entity/exercise-set.entity';

export class Component extends Attribute<Record<string, unknown>> {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  params?: ExerciseMainParamField[]; // exercise params fields

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  attributes?: string[];

  @ValidateNested({ each: true })
  @Type(() => Component)
  @ApiPropertyOptional({ type: () => Component, isArray: true })
  @IsOptional()
  @Expose()
  options?: Component[];
}
