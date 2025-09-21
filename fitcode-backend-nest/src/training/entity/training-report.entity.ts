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
  institutionId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId?: string;

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
  exercises: number;

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
  recTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  activeTime: number; // total time under tension

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tonnage: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  timeWork: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  distWork: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  power: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  realizationScore: number;

  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleValue)
  @ApiProperty({ type: () => ExerciseMuscleValue, isArray: true })
  @Expose()
  muscleValues: ExerciseMuscleValue[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  completedComponentIds: string[]; // list of completed component ids, just for frontend display

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  photoURL?: string; // "best" photo of the training session

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  timeVol?: number; // total time prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  distVol?: number; // total distance prescribed (in meters)

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  recDist?: number; // total recovery distance prescribed (in meters)
}
