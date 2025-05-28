import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';

export class CreateTrainingDto extends PickType(Training, [
  'groupId',
  'cycleId',
  'components',
  'copiedFromId',
  'stats',
  'futureStats',
]) {}
