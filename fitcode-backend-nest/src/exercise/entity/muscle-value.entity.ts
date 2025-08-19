import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { MuscleType } from '../enum/muscle.enum';

export class MuscleValue {
  @ApiProperty({ enum: MuscleType })
  @IsNotEmpty()
  @IsEnum(MuscleType)
  @Expose()
  muscleType: MuscleType;

  @ValidateNested({ each: true })
  @Type(() => MuscleValue)
  @ApiPropertyOptional({ type: () => MuscleValue, isArray: true })
  @IsOptional()
  @Expose()
  children?: MuscleValue[];
}
