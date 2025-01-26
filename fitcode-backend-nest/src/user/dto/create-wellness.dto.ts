import { PickType } from '@nestjs/mapped-types';
import { Wellness } from '../entity/wellness.entity';
import { CreateWellness } from '../type/wellness.type';

export class CreateWellnessDto
  extends PickType(Wellness, ['sleep', 'fatigue', 'soreness', 'comment'])
  implements CreateWellness {}
