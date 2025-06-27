import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrainingComponentInfoDto extends PickType(TrainingComponent, [
  'id',
  'color',
  'from',
  'to',
  'target',
  'methodId',
  'copiedFrom',
] as const) {
  @Type(() => SubgroupInfoDto)
  @ValidateNested({ each: true })
  @ApiProperty()
  @Expose()
  subgroups: SubgroupInfoDto[];
}

export class SubgroupInfoDto extends PickType(Subgroup, [
  'id',
  'futureStats',
] as const) {}

export class TrainingInfoDto extends PickType(Training, [
  'id',
  'institutionId',
  'groupId',
  'cycleId',
  'copiedFromId',
  'stats',
  'futureStats',
  'from',
  'to',
] as const) {
  @Type(() => TrainingComponentInfoDto)
  @ValidateNested()
  @ApiProperty()
  @Expose()
  warmup: TrainingComponentInfoDto;

  @Type(() => TrainingComponentInfoDto)
  @ValidateNested()
  @ApiProperty()
  @Expose()
  cooldown: TrainingComponentInfoDto;

  @Type(() => TrainingComponentInfoDto)
  @ValidateNested({ each: true })
  @ApiProperty()
  @Expose()
  components: TrainingComponentInfoDto[];
}
