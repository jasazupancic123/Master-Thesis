import { IdEntity } from '../../common/entity/id.entity';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrainingExercise } from './training-exercise.entity';
import { TrainingComponent } from './training-component.entity';

export class Superset {
  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  order?: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @IsObject()
  @ApiProperty()
  @Expose()
  exercises: {
    [exerciseId: string]: TrainingExercise;
  };
}
