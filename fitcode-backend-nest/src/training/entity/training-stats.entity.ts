import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class TrainingStats {
  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalComponents: number; // total number of components in the training

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalSupersets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalExercises: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalSets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalReps: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalLoad: number; // total weight lifted prescribed in kilograms

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalTonnage: number; // total weight lifted prescribed (in kg: sets * reps * weight)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalTempo: number; // total tempo prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  totalRecTime: number; // total recovery time prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalActiveTime: number; // time when executing the training (in seconds) - sets * reps/dist/time * tempo (sum), for example 3 * 12 * 1:0:1 tempo (2s) = 72s

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  totalTimeVol?: number; // total time prescribed (in seconds)

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  totalDistVol?: number; // total distance prescribed (in meters)

  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  totalRecDist?: number; // total recovery distance prescribed (in meters)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalRealizationScore: number; // tonnage and also time, distance, tempo prescribed - saved as a score of points
}
