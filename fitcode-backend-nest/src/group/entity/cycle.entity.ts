import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { IntersectionType } from '@nestjs/mapped-types';
import { ColorEntity } from '../../common/entity/color.entity';
import { SelectTargetsDto } from './selected-targets.dto';

export interface Week {
  date: Date;
}

export class Cycle extends IntersectionType(BaseEntity, ColorEntity) {
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
  from: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @ValidateNested({ each: true })
  @Type(() => SelectTargetsDto)
  @ApiProperty()
  @Expose()
  selectedTargets: SelectTargetsDto[];

  // virtual
  weeks?: Week[][];
}
