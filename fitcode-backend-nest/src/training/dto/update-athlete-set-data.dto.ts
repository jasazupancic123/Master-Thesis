import { PickType } from '@nestjs/mapped-types';
import { UserWorkload } from '../entity/user-workload.entity';

export class UpdateAthleteSetDataDto extends PickType(UserWorkload, [
  'data',
] as const) {}
