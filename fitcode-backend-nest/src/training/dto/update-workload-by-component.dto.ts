import { PickType } from '@nestjs/mapped-types';
import { Workload } from '../entity/workload.entity';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkloadByComponent extends PickType(Workload, [
  'exerciseId',
  'setNumber',
  'notes',
  'volWork1Value',
  'volWork2Value',
  'volRecValue',
  'intWork1Value',
  'intWork2Value',
  'intRecValue',
] as const) {}

export class UpdateWorkloadsByComponent {
  @ValidateNested({ each: true })
  @Type(() => UpdateWorkloadByComponent)
  @ApiProperty()
  @Expose()
  workloads: UpdateWorkloadByComponent[];
}
