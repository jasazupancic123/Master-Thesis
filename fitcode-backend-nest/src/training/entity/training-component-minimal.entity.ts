import { ApiProperty, PickType } from '@nestjs/swagger';
import { TrainingComponent } from './training-component.entity';
import { SubgroupMinimal } from './subgroup-minimal.entity';
import { Type, Expose } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class TrainingComponentMinimal extends PickType(TrainingComponent, [
  'id',
  'from',
  'to',
  'target',
  'methodId',
  'copiedFrom',
]) {
  @ValidateNested({ each: true })
  @Type(() => SubgroupMinimal)
  @ApiProperty()
  @Expose()
  subgroups: SubgroupMinimal[];
}
