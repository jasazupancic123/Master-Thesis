import { PickType } from '@nestjs/mapped-types';

import { Wellness } from '../entity/wellness.entity';

export class SaveWellnessDto extends PickType(Wellness, [
  'date',
  'weight',
  'comment',
  'fatigue',
  'soreness',
  'sleep',
]) {}
