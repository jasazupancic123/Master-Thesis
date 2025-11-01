import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

import { TrainingExercise } from './training-exercise.entity';

export class Superset {
  @ValidateNested({ each: true })
  @Type(() => TrainingExercise)
  @ApiProperty({ type: () => TrainingExercise, isArray: true })
  @Expose()
  exercises: TrainingExercise[];

  @IsBoolean()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  warmup?: boolean; // whether this superset is a warmup superset

  @IsBoolean()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  cooldown?: boolean; // whether this superset is a cooldown superset
}
