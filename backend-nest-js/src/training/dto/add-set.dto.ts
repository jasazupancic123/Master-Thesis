import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';

export class AddSetDto extends PickType(TrainingComponent, [
  'trainingId',
  'componentId',
  'order',
] as const) {
}