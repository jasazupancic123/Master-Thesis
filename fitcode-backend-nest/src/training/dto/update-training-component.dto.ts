import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';
import { UpdateTrainingComponent } from '../type/training-component.type';

export class UpdateTrainingComponentDto
  extends PickType(TrainingComponent, ['order', 'color'] as const)
  implements UpdateTrainingComponent {}
