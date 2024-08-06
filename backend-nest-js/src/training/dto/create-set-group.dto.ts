import { PickType } from '@nestjs/mapped-types';
import { SetGroupEntity } from '../../set/entity/set-group.entity';

export class CreateSetGroupDto extends PickType(SetGroupEntity, [
  'trainingId',
  'componentId',
  'order',
] as const) {
}