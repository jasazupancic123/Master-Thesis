import { PickType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';

export class ComponentParam extends PickType(Attribute, [
  'field',
  'defaultValue',
] as const) {
  @ValidateNested({ each: true })
  @Type(() => ComponentParam)
  @IsOptional()
  @ApiPropertyOptional({ type: () => ComponentParam, isArray: true })
  @Expose()
  options?: ComponentParam[]; // filtered option fields from select attribute
}
