import { IdEntity } from '../../common/entity/id.entity';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrainingExercise } from './training-exercise.entity';
import { TrainingComponent } from './training-component.entity';

export class TrainingSuperset extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  componentId: string; // training component id
  component?: TrainingComponent;

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
