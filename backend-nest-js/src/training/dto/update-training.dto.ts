import { PartialType } from '@nestjs/swagger';
import { CreateTrainingDto } from './create-training.dto';
import { PickType } from '@nestjs/mapped-types';

export class UpdateTrainingDto extends PartialType(
  PickType(CreateTrainingDto, [
    'from',
    'to',
  ] as const),
) {
}
