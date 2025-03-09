import { PickType } from '@nestjs/mapped-types';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ComponentParam extends PickType(Attribute, [
  'field',
  'defaultValue',
] as const) {
  @ValidateNested({ each: true })
  @Type(() => ComponentParam)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  options?: ComponentParam[]; // filtered option fields from select attribute
}
