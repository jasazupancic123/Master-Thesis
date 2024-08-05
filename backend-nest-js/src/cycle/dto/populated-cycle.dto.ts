import { IsArray, IsDate, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { GroupDto } from '../../group/dto/group.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickType } from '@nestjs/mapped-types';
import { CycleDto } from './cycle.dto';

export class CycleWeekDto {
  @IsDate()
  @ApiProperty()
  @Expose()
  date: Date;
}

export class PopulatedCycleDto extends PickType(CycleDto, ['id', 'description'] as const) {
  @ValidateNested()
  @Type(() => GroupDto)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  group: GroupDto;
}