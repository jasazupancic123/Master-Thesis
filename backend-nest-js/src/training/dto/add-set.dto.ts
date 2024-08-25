import { PickType } from '@nestjs/mapped-types';
import { SetGroup } from '../../set/entity/set-group.entity';

export class AddSetDto extends PickType(SetGroup, [
  'trainingId',
  'componentId',
  'order',
] as const) {
}