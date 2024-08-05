import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class TrainingFilterDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  cycleId?: string;

  @IsDate()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;

  @IsDate()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;
}