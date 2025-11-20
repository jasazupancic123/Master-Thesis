import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { TrainingComponent } from '../entity/training-component.entity';

export class AddTrainingComponentsDto {
  @ValidateNested({ each: true })
  @Type(() => TrainingComponent)
  @ApiProperty({ type: [TrainingComponent] })
  @Expose()
  components: TrainingComponent[];
}
