import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';

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

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  rootComponentsIds: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  leafComponentsIds: string[];

  // virtual
  weeks?: Week[][];
}
