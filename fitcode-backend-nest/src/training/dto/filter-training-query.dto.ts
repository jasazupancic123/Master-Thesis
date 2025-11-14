import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';

import { Training } from '../entity/training.entity';

export class FilterTrainingQueryDto extends IntersectionType(
  PartialType(PickType(Training, ['groupId', 'cycleId'] as const)),
  DateFilterDto,
) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  institutionId: string;

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
