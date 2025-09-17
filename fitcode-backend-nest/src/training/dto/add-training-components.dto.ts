import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CreateTrainingComponentDto } from './create-training.dto';

export class AddTrainingComponentsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingComponentDto)
  @ApiProperty({ type: [CreateTrainingComponentDto] })
  @Expose()
  components: CreateTrainingComponentDto[];
}
