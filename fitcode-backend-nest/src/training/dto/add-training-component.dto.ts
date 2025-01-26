import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';
import { CreateTrainingComponent } from '../type/training-component.type';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddTrainingComponentDto
  extends PickType(TrainingComponent, ['componentId', 'color', 'supersets'])
  implements Omit<CreateTrainingComponent, 'supersets'> {}

export class AddTrainingComponentsDto {
  @ValidateNested({ each: true })
  @Type(() => AddTrainingComponentDto)
  @ApiProperty()
  @Expose()
  components: AddTrainingComponentDto[];
}
