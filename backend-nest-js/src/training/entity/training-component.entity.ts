import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Component } from '../../component/entity/component.entity';
import { TrainingSuperset } from './training-superset.entity';

export class TrainingComponent {
  @IsString()
  @IsNotEmpty()
  @Expose()
  componentId: string; // check that component is root component
  component?: Component; // virtual

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  order: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @ValidateNested({ each: true })
  @Type(() => TrainingSuperset)
  @ApiProperty()
  @Expose()
  supersets: TrainingSuperset[];
}
