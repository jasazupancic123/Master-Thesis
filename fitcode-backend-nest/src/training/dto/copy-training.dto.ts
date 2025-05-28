import { PickType, IntersectionType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { DateRangeDto } from '../../common/dto/date-range.dto';
import { CreateTrainingDto } from './create-training.dto';

export class CopyTrainingDto extends IntersectionType(
  PickType(Training, ['copiedFromId']),
) {
  @Type(() => DateRangeDto)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  date?: DateRangeDto;

  @Type(() => CreateTrainingDto)
  @Expose()
  @ApiProperty()
  @ValidateNested()
  training: CreateTrainingDto;
}
