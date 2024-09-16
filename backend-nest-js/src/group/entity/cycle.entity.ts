import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { Training } from '../../training/entity/training.entity';
import { BaseEntity } from '../../common/entity/base.entity';
import { Group } from './group.entity';
import { Subgroup } from './subgroup.entity';

export interface Week {
  date: Date;
}

export class Cycle extends BaseEntity {
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
  @Type(() => Training)
  @ApiProperty()
  @Expose()
  trainings: Training[];

  @ApiProperty()
  @Expose()
  weeks: Week[][]; // virtual

  group: Group | null; // virtual
  subgroups: Subgroup[]; // virtual
}
