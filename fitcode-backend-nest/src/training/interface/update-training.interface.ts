import type { CreatePrescribedWorkloadDto } from '../dto/create-workload.dto';
import type { UpdateTrainingComponentDto } from '../dto/update-training.dto';
import type { Subgroup } from '../entity/subgroup.entity';
import type { TrainingComponent } from '../entity/training-component.entity';
import type { TrainingExercise } from '../entity/training-exercise.entity';

export type UpdateTrainingExercise = Pick<TrainingExercise, 'id' | 'sets'>;

export type UpdateSuperset = {
  exercises: UpdateTrainingExercise[];
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'parentId' | 'name' | 'membersIds' | 'mainSet'
> & {
  supersets: UpdateSuperset[];
};

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'targetId' | 'methodId' | 'mainSet' | 'from' | 'to'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};

export type UpdateTrainingComponentWithoutTime = Omit<
  UpdateTrainingComponent,
  'from' | 'to'
>;

export type UpdateTraining = {
  components: UpdateTrainingComponentDto[];
  workloads?: CreatePrescribedWorkloadDto[]; // custom workloads
};
