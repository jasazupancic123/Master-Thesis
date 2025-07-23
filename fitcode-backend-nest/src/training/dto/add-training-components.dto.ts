import { PickType } from '@nestjs/mapped-types';

import { Training } from '../entity/training.entity';

export class AddTrainingComponentsDto extends PickType(Training, [
  'components',
] as const) {}
