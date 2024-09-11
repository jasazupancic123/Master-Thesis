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
import { TrainingExercise } from './training-exercise.entity';
import { Component } from '../../component/entity/component.entity';

export class TrainingComponent {
  @IsString()
  @IsNotEmpty()
  @Expose()
  componentId: string; // check that component is root component
  component: Component | null; // virtual

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
  @Type(() => TrainingExercise)
  @ApiProperty()
  @Expose()
  exercises: TrainingExercise[];
}
