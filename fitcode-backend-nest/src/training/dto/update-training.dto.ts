import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';

export class UpdateTrainingDto extends PickType(Training, ['components']) {}
