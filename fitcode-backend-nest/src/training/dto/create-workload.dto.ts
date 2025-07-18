import { IntersectionType, PickType } from '@nestjs/mapped-types';

import { WorkloadMeta } from '../entity/workload.entity';
import { PrescribedWorkload } from '../entity/workload-value.entity';

export class CreatePrescribedWorkloadDto extends IntersectionType(
  PickType(WorkloadMeta, [
    'userId',
    'componentId',
    'exerciseId',
    'supersetIndex',
    'setNumber',
    'notes',
  ] as const),
  PrescribedWorkload,
) {}
