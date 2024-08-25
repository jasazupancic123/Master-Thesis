import { PickType } from '@nestjs/mapped-types';
import { BaseEntity } from '../entity/base.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IdDto extends PickType(BaseEntity, ['id'] as const) {
}

export class IdsDto {
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({ type: String, isArray: true })
  @Expose()
  ids?: string[];
}