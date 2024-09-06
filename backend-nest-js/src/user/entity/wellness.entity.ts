import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimestampEntity } from '../../common/entity/timestamp.entity';

export class Wellness extends TimestampEntity {
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