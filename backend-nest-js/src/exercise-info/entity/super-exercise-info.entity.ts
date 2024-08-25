import { Entity } from '../../common/decorator/entity.decorator';
import { SUPER_EXERCISE_INFO_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { Effort } from '../enum/effort.enum';

// NOTE - any values that are represented in % are NOT normalized between 0 and 1 (BW, INT, RM, ...)

@Entity(SUPER_EXERCISE_INFO_COLLECTION)
export class SuperExerciseInfo extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  setExerciseId: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  sets: number;

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
  @Min(0)
  @ApiProperty()
  @Expose()
  workloadValue: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: string;

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
  rec: number; // recovery
}