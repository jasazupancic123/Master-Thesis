import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TraininComponentStats {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalSets: number; // for calculating status
}

export class TrainingStats {
  @Type(() => TraininComponentStats)
  @ValidateNested({ each: true })
  @ApiProperty({ type: () => TraininComponentStats, isArray: true })
  @Expose()
  plannedComponents: TraininComponentStats[];

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalDuration: number; // in minutes

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalComponents: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalSupersets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalExercises: number; // unique

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
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  totalRecTime: number; // total recovery time (for all sets, in seconds)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalActiveTime: number; // time when executing the training (in seconds) - sets * reps/dist/time * tempo (sum), for example 3 * 12 * 1:0:1 tempo (2s) = 72s @IsNumber()

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalTonnage: number; // total weight lifted prescribed (in kg: sets * reps * weight)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalTimeWork: number; // total time under load

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalDistWork: number; // total distance under load

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalPower: number; // total power output (in watts)

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalRealizationScore: number; // tonnage and also time, distance, tempo prescribed - saved as a score of points

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
}
