import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Target } from './target.entity';
import { PickType } from '@nestjs/mapped-types';
import { ComponentLevel } from '../enum/component-level.enum';
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
