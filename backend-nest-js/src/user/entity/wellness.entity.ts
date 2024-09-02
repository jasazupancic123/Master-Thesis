import { Entity } from '../../common/decorator/entity.decorator';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity('wellness')
export class Wellness extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  date: Date;

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