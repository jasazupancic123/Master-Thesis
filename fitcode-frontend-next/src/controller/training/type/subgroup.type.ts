import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';
import { Superset, UpdateSuperset } from './superset.type';
import { TrainingExerciseAverageStats } from './training-exercise-average-stats.type';
import { PeriodizationType } from '../enum/periodization-type.enum';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];
    periodizationType?: PeriodizationType;
    futureStats: TrainingExerciseAverageStats[]; // completed is stored on training only

    // mapped properties
    members?: User[];
  };

export type SubgroupInfo = IdEntity & {
  futureStats: TrainingExerciseAverageStats[]; // completed is stored on training only
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'color' | 'membersIds' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};
