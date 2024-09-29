import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsStringOrNumber } from '../../common/decorator/is-string-or-number.decorator';

export class TrainingExerciseUserData {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  supersetId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsStringOrNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  workloadValue: string | number; // calculated value prescribed by trainer

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  completedSets: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  completedSetTypeValue?: number; // actual user reps / distance / time / ... completed

  @IsStringOrNumber()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  completedWorkloadValue?: string | number; // actual user kg / % / ... completed
}
