import type { CreatePrescribedWorkloadDto } from '../dto/create-workload.dto';
import type { UpdateTrainingComponentDto } from '../dto/update-training.dto';
import type { Subgroup } from '../entity/subgroup.entity';
import type { Superset } from '../entity/superset.entity';
import type { Training } from '../entity/training.entity';
import type { TrainingComponent } from '../entity/training-component.entity';
import type { TrainingExercise } from '../entity/training-exercise.entity';

export type UpdateTrainingExercise = Pick<
  TrainingExercise,
  'id' | 'color' | 'sets'
>;

export type UpdateSuperset = Pick<Superset, 'color'> & {
  exercises: UpdateTrainingExercise[];
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'color' | 'membersIds' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'color' | 'from' | 'to' | 'target' | 'periodizationType' | 'methodId'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};

export type UpdateTraining = Pick<
  Training,
  'membersIds' | 'warmup' | 'cooldown'
> & {
  components: UpdateTrainingComponentDto[];
  workloads?: CreatePrescribedWorkloadDto[]; // custom workloads
};
