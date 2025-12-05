import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

import { WorkloadRef } from '@src/common/type/firestore.type';

import { CreateWorkload } from '../entity/workload.entity';

export class WorkloadRefDto implements WorkloadRef {
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

  @IsNumber()
  @ApiProperty()
  @Expose()
  supersetIndex: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsNumber()
  @ApiProperty()
  @Expose()
  setNumber: number;
}

export class PartialWorkload extends PartialType(CreateWorkload) {}

export class UpdateWorkloadDto {
  @ValidateNested()
  @Type(() => WorkloadRefDto)
  @ApiProperty({ type: WorkloadRefDto })
  @Expose()
  ref: WorkloadRefDto;

  @ValidateNested()
  @Type(() => PartialWorkload)
  @ApiProperty({ type: PartialWorkload })
  @Expose()
  data: PartialWorkload;
}

export class UpdateManyWorkloadsDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateWorkloadDto)
  @ApiProperty({ type: UpdateWorkloadDto, isArray: true })
  @Expose()
  updates: UpdateWorkloadDto[];

  @ValidateNested({ each: true })
  @Type(() => WorkloadRefDto)
  @ApiProperty({ type: WorkloadRefDto, isArray: true })
  @Expose()
  deletes?: WorkloadRefDto[];
}
