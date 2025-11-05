import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { ExerciseMuscleValue } from '@src/exercise/entity/exercise-muscle-value.entity';

import { PrescribedTrainingStats } from './training-stats.entity';

// id: <training-id>-<user-id>
export class TrainingReport extends IntersectionType(
  DateRangeDto,
  OmitType(PrescribedTrainingStats, ['plannedComponents'] as const),
) {
  @ValidateNested()
  @Type(() => PrescribedTrainingStats)
  @ApiProperty({ type: () => PrescribedTrainingStats })
  @Expose()
  prescribed: PrescribedTrainingStats;

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
  @Max(100)
  @ApiProperty()
  @Expose()
  realization: number; // percentage of the prescribed training that was actually completed, from 0 to 100

  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleValue)
  @ApiProperty({ type: () => ExerciseMuscleValue, isArray: true })
  @Expose()
  muscleValues: ExerciseMuscleValue[];

  @ValidateNested({ each: true })
  @Type(() => TrainingReportComponentStatus)
  @ApiProperty({ type: () => TrainingReportComponentStatus, isArray: true })
  @Expose()
  componentStatuses: TrainingReportComponentStatus[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @Expose()
  photoURLs?: string[]; // "best" photo(s) of the training session
}

export class TrainingReportComponentStatus {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsEnum(['not_started', 'in_progress', 'completed'] as const)
  @ApiProperty({ enum: ['not_started', 'in_progress', 'completed'] })
  @Expose()
  status: 'not_started' | 'in_progress' | 'completed';
}
