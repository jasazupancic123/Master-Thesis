import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';
import { UpdateTrainingComponent } from '../type/training-component.type';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class UpdateTrainingComponentDto
  extends IntersectionType(
    PickType(TrainingComponent, ['order', 'color'] as const),
    SubgroupIdDto,
  )
  implements UpdateTrainingComponent {}
