import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';
import { CreateTrainingComponent } from '../type/training-component.type';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class AddTrainingComponentDto
  extends PickType(TrainingComponent, ['id', 'order', 'color'])
  implements Omit<CreateTrainingComponent, 'supersets'> {}

export class AddTrainingComponentsDto extends SubgroupIdDto {
  @ValidateNested({ each: true })
  @Type(() => AddTrainingComponentDto)
  @ApiProperty()
  @Expose()
  components: AddTrainingComponentDto[];
}
