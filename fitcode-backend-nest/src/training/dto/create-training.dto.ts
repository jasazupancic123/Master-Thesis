import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DateRangeDto } from '../../common/dto/date-range.dto';

export class PartialCreateTrainingDto extends PickType(Training, [
  'groupId',
  'cycleId',
  'components',
]) {}

export class CreateTrainingDto {
  @Type(() => PartialCreateTrainingDto)
  @Expose()
  @ApiProperty()
  @ValidateNested()
  training: PartialCreateTrainingDto;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  copyFromTrainingId?: string;

  @Type(() => DateRangeDto)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  date?: DateRangeDto;
}
