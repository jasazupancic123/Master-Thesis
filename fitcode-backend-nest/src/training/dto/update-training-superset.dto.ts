import { PickType } from '@nestjs/mapped-types';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { UpdateTrainingSuperset } from '../type/training-superset.type';

export class UpdateTrainingSupersetDto
  extends PickType(TrainingSuperset, ['order', 'color'] as const)
  implements UpdateTrainingSuperset {}
