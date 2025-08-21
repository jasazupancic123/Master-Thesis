import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PeriodizationType } from '../enum/periodization-type.enum';

export class PeriodizeTrainingsDto {
  @ApiProperty({ enum: PeriodizationType })
  @IsNotEmpty()
  @IsEnum(PeriodizationType)
  @Expose()
  periodizationType: PeriodizationType;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  exerciseIds: string[]; // IDs of the exercises to periodize

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  subgroupId?: string; // ID of the subgroup to periodize
}
