import { PickType } from '@nestjs/mapped-types';
import { Workload } from '../entity/workload.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreateWorkloadDto extends PickType(Workload, [
  'userId',
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

export type CreateWorkload = CreateWorkloadDto;

export class CreateWorkloadsDto {
  @ValidateNested({ each: true })
  @Type(() => Workload)
  @Expose()
  @ApiProperty()
  workloads: Workload[];
}
