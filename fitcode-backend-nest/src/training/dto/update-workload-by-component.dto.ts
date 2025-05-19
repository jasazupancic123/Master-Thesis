import { PickType } from '@nestjs/mapped-types';
import { Workload } from '../entity/workload.entity';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkloadByComponent extends PickType(Workload, [
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

export class UpdateWorkloadsByComponent {
  @ValidateNested({ each: true })
  @Type(() => UpdateWorkloadByComponent)
  @ApiProperty()
  @Expose()
  workloads: UpdateWorkloadByComponent[];
}
