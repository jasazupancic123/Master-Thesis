import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Workload } from '../entity/workload.entity';

export class CreateWorkloadDto extends PickType(Workload, [
  'userId',
  'exerciseId',
  'setNumber',
  'notes',
  'volWork1ValueL',
  'volWork1ValueR',
  'volWork2ValueL',
  'volWork2ValueR',
  'volRecValueL',
  'volRecValueR',
  'intWork1ValueL',
  'intWork1ValueR',
  'intWork2ValueL',
  'intWork2ValueR',
  'intRecValueL',
  'intRecValueR',
] as const) {}

export type CreateWorkload = CreateWorkloadDto;

export class CreateWorkloadsDto {
  @ValidateNested({ each: true })
  @Type(() => Workload)
  @Expose()
  @ApiProperty()
  workloads: Workload[];
}
