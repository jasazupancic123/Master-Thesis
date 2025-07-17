import { PickType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ComponentLevel } from '../enum/component-level.enum';
import { Target } from './target.entity';
export class PartialTarget extends PickType(Target, ['componentId'] as const) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  targetId: string;

  @ApiPropertyOptional({ enum: ComponentLevel, enumName: 'ComponentLevel' })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ComponentLevel)
  @Expose()
  componentLevel?: ComponentLevel;
}
