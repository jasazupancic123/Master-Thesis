import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ExerciseSet } from '../entity/exercise-set.entity';

export enum TrainingAction {
  // TODO - not implemented yet
  /* // component
  ADD_COMPONENT = 'ADD_COMPONENT',
  UPDATE_COMPONENT = 'UPDATE_COMPONENT', // from, to, target
  REMOVE_COMPONENT = 'REMOVE_COMPONENT',

  // subgroup (payload must include componentId)
  ADD_SUBGROUP = 'ADD_SUBGROUP',
  UPDATE_SUBGROUP = 'UPDATE_SUBGROUP', // name, membersIds 
  REMOVE_SUBGROUP = 'REMOVE_SUBGROUP',
  // virtual subgroup (payload must include componentId and parentId)
  ADD_VIRTUAL_SUBGROUP = 'ADD_VIRTUAL_SUBGROUP',
  UPDATE_VIRTUAL_SUBGROUP = 'UPDATE_VIRTUAL_SUBGROUP',
  REMOVE_VIRTUAL_SUBGROUP = 'REMOVE_VIRTUAL_SUBGROUP', */

  // superset (payload must include componentId and optionally subgroupId)
  ADD_SUPERSET = 'ADD_SUPERSET',
  // UPDATE_SUPERSET_TO_CIRCUIT = 'UPDATE_SUPERSET_TO_CIRCUIT',
  // UPDATE_SUPERSET_TO_BLOCK = 'UPDATE_SUPERSET_TO_BLOCK',
  // UPDATE_SUPERSET_TO_WARMUP = 'UPDATE_SUPERSET_TO_WARMUP',
  // UPDATE_SUPERSET_TO_COOLDOWN = 'UPDATE_SUPERSET_TO_COOLDOWN',
  REMOVE_SUPERSET = 'REMOVE_SUPERSET',

  // exercise
  ADD_EXERCISE = 'ADD_EXERCISE',
  // APPLY_METHOD_TO_EXERCISE = 'APPLY_METHOD_TO_EXERCISE',
  REMOVE_EXERCISE = 'REMOVE_EXERCISE',

  // set (payload must include componentId, optionally subgroupId, and mandatory supersetIndex and exerciseId)
  ADD_SET = 'ADD_SET',
  UPDATE_SET = 'UPDATE_SET', // load, reps, ...
  REMOVE_SET = 'REMOVE_SET',
}

export class TrainingActionRef {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  userId?: string; // if provided, move user to virtual subgroup

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  componentId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  subgroupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  parentId?: string;

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  supersetIndex?: number;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  exerciseId?: string;

  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  setNumber?: number;
}

export class TrainingActionPayload {
  @ValidateNested()
  @Type(() => ExerciseSet)
  @ApiPropertyOptional({ type: () => ExerciseSet })
  @IsOptional()
  @Expose()
  set?: ExerciseSet;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  methodId?: string;
}

export class TrainingActionPayloadDto {
  @IsEnum(TrainingAction)
  @ApiProperty({ enum: TrainingAction })
  @Expose()
  action: TrainingAction;

  @ValidateNested()
  @Type(() => TrainingActionRef)
  @ApiProperty({ type: () => TrainingActionRef })
  @Expose()
  ref: TrainingActionRef;

  @ValidateNested()
  @Type(() => TrainingActionPayload)
  @ApiProperty({ type: () => TrainingActionPayload })
  @Expose()
  payload: TrainingActionPayload;
}
