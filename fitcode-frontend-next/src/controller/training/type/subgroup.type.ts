import { User } from '@/controller/user/type/user.type';
import { TrainingPlan } from './training-plan.type';
import { BaseEntity } from '@/common/type/entity.type';

export type Subgroup = BaseEntity & {
  name: string;
  membersIds: string[];
  components: TrainingPlan;

  // mapped properties
  members?: User[];
};
