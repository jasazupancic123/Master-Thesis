import { IntersectionType, PickType } from '@nestjs/mapped-types';

import { Workload, WorkloadMeta } from '../entity/workload.entity';

export class CreatePrescribedWorkloadDto extends IntersectionType(
  PickType(WorkloadMeta, [
    'userId',
    'componentId',
    'exerciseId',
    'supersetIndex',
    'setNumber',
    'notes',
  ] as const),
  Workload,
) {}
