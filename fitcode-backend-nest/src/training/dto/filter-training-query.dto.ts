import { Training } from '../entity/training.entity';
import { DateFilterDto } from '../../common/dto/date-filter.dto';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTrainingQueryDto extends IntersectionType(
  PartialType(PickType(Training, ['groupId', 'cycleId'] as const)),
  DateFilterDto,
) {
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  minimal?: boolean;
}
