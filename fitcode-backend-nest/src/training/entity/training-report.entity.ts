import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { ExerciseMuscleValue } from '@src/exercise/entity/exercise-muscle-value.entity';

import { TrainingStats } from './training-stats.entity';

// id: <training-id>-<user-id>
export class TrainingReport extends IntersectionType(
  TrainingStats,
  DateRangeDto,
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsBoolean()
  @ApiProperty()
  @Expose()
  completed: boolean;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  duration: number; // in minutes

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  components: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  sets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  reps: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tonnage: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tempoTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  recTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  activeTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  realizationPoints: number; // tonnage and also time, distance, tempo realized - realization % is then calculated from this

  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleValue)
  @ApiProperty({ type: () => ExerciseMuscleValue, isArray: true })
  @Expose()
  exerciseMuscleValues: ExerciseMuscleValue[];

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  photoURL?: string; // "best" photo of the training session

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  completedComponentIds: string[]; // list of completed component ids, just for frontend display
}
