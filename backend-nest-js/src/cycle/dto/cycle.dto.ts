import { IsDate, IsDateString, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { GroupDto } from '../../group/dto/group.dto';

export class CycleDto {
  @IsString()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @ApiProperty()
  @Expose()
  groupId: string; // group the cycle belongs to

  @ValidateNested()
  @Type(() => GroupDto)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  group?: GroupDto;

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  endDate: Date;
}