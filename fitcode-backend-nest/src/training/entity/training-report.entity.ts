import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { ExerciseMuscleValue } from '@src/exercise/entity/exercise-muscle-value.entity';

import { TrainingStatus } from '../enum/training-status.enum';

// id: <training-id>-<user-id>
export class TrainingReport extends DateRangeDto {
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

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  completedComponentIds: string[]; // list of completed component ids, just for frontend display

  @IsEnum(TrainingStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: TrainingStatus })
  @Expose()
  status: TrainingStatus; // overall status of the training

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedSets: number; // total number of sets in the training

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedSets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedVolume: number; // total volume (reps, time, dist)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedVolume: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedWeight: number; // total weight lifted prescribed (in kg - sets * reps * weight), same as tonnage

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedWeight: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedTempo: number; // total tempo prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedTempo: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedRecovery: number; // total recovery time prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedRecovery: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedActiveTime: number; // time when executing the training (in seconds) - sets * reps/dist/time * tempo (sum), for example 3 * 12 * 1:0:1 tempo (2s) = 72s

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedActiveTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedRealizationPoints: number; // tonnage and also time, distance, tempo prescribed - saved as a score of points

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
}
