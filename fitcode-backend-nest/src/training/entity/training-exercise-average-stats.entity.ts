import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TrainingExerciseAverageStats {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  rootComponentId: string; // strength, speed, ...

  @IsInt()
  @ApiProperty()
  @Expose()
  numMembers: number; // to calculate new average workload stats

  @IsNumber()
  @ApiProperty()
  @Expose()
  intensity: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  volume: number;
}
