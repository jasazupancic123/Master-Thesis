import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class FilterExerciseDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.split(',') || [])
  componentIds?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.split(',') || [])
  ids?: string[];

  @IsInt()
  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  limit?: number;
}