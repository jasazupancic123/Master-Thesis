import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
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
  REMOVE_VIRTUAL_SUBGROUP = 'REMOVE_VIRTUAL_SUBGROUP',

  // superset (payload must include componentId and optionally subgroupId)
  ADD_SUPERSET = 'ADD_SUPERSET',
  UPDATE_SUPERSET = 'UPDATE_SUPERSET', // warmup, cooldown, main set
  REMOVE_SUPERSET = 'REMOVE_SUPERSET', */

  // exercise
  ADD_EXERCISE = 'ADD_EXERCISE',
  // UPDATE_EXERCISE = 'UPDATE_EXERCISE', // method
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
  @Expose()
  userId?: string; // if provided, move user to virtual subgroup

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  componentId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  parentId?: string;

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  supersetIndex?: number;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  exerciseId?: string;

  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  @Expose()
  setNumber?: number;
}

export class TrainingActionPayload {
  @ValidateNested()
  @Type(() => ExerciseSet)
  @ApiProperty({ type: () => ExerciseSet })
  @Expose()
  set?: ExerciseSet;
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
