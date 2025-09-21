import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';

import { Training } from '../entity/training.entity';

export class FilterTrainingQueryDto extends IntersectionType(
  PartialType(PickType(Training, ['groupId', 'cycleId'] as const)),
  DateFilterDto,
) {
  @IsOptional()
  @IsBoolean()
  @Expose()
  @ApiPropertyOptional()
  populate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  @ApiPropertyOptional()
  limit?: number;
}
