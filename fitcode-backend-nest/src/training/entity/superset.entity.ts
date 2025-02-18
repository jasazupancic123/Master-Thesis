import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TrainingExercise } from './training-exercise.entity';

export class Superset {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @ValidateNested({ each: true })
  @Type(() => TrainingExercise)
  @ApiProperty()
  @Expose()
  exercises: TrainingExercise[];
}
