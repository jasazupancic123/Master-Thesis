import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';

export class AddTrainingComponentDto extends PickType(TrainingComponent, [
  'componentId',
  'order',
] as const) {
}