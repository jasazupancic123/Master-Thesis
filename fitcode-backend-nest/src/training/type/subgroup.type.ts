import { Subgroup } from '../../training/entity/subgroup.entity';
import { TrainingComponent } from '../entity/training-component.entity';

export type CreateSubgroup = Pick<
  Subgroup,
  'name' | 'membersIds' | 'components'
>;

export type UpdateSubgroup = Partial<CreateSubgroup>;
