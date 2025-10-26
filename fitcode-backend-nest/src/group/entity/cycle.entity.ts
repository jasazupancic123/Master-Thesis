import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';
import { PartialTarget } from '@src/target/entity/partial-target.dto';

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
  @Type(() => PartialTarget)
  @ApiProperty({ type: () => PartialTarget, isArray: true })
  @Expose()
  selectedTargets: PartialTarget[];
}
