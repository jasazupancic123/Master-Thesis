import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Component } from '../../component/entity/component.entity';
import { Superset } from './superset.entity';
import { Training } from './training.entity';
import { TrainingExercise } from './training-exercise.entity';
import { IdEntity } from 'src/common/entity/id.entity';

export class TrainingComponent extends IdEntity {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  order: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @IsObject()
  @ApiProperty()
  @Expose()
  supersets: Superset[];
}
