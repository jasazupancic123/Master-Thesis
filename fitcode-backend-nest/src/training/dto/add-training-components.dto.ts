import { PickType } from '@nestjs/mapped-types';
import { CreateTrainingDto } from './create-training.dto';

export class AddTrainingComponentsDto extends PickType(CreateTrainingDto, [
  'componentsIds',
] as const) {}
