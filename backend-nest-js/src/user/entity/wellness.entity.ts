import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entity/base.entity';

export class Wellness extends BaseEntity {
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  sleep?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  fatigue?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  soreness?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  comment?: string;
}
