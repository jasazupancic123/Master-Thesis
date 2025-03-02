import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { Effort } from '../enum/effort.enum';

// NOTE - any values that are represented in % are NOT normalized between 0 and 1 (BW, INT, RM, ...)

export class ExerciseMeta {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  set: number; // number of sets

  @IsEnum(SetType)
  @ApiProperty()
  @Expose()
  setType: SetType;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  setTypeValue: number;

  @IsEnum(WorkloadType)
  @ApiProperty()
  @Expose()
  workloadType: WorkloadType;

  @IsInt()
  @ApiProperty()
  @Expose()
  workloadValue: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: string;
  // TODO - custom validation for tempo, e.g. 2-0-1

  @IsEnum(Effort)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  effort?: Effort;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  rec?: number; // recovery
}
