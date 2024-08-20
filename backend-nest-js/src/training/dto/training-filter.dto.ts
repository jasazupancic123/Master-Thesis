import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class TrainingFilterDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  cycleId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  endDate?: Date;
}