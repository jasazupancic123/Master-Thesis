import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { ExerciseMainParamField } from '@src/training/entity/exercise-set.entity';

export class MethodAbility extends PickType(
  Attribute<Record<ExerciseMainParamField | 'sets', unknown>>,
  ['field', 'min', 'max', 'pattern'] as const,
) {
  @IsBoolean()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  disabled?: boolean;
}

export class Method extends Attribute {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @ValidateNested({ each: true })
  @Type(() => MethodAbility)
  @ApiProperty({ type: MethodAbility, isArray: true })
  @Expose()
  attributes: MethodAbility[];
}
