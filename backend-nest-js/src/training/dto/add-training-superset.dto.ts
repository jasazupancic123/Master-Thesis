import { PickType } from '@nestjs/mapped-types';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { CreateTrainingSuperset } from '../type/training-superset.type';

export class AddTrainingSupersetDto
  extends PickType(TrainingSuperset, ['color', 'exercises'])
  implements CreateTrainingSuperset {}
