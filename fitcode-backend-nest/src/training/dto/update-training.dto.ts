import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Subgroup } from '../entity/subgroup.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Workload } from '../entity/workload.entity';
import {
  UpdateSubgroup,
  UpdateSuperset,
  UpdateTraining,
  UpdateTrainingComponent,
  UpdateTrainingExercise,
} from '../interface/update-training.interface';

export class UpdateTrainingExerciseDto
  extends PickType(TrainingExercise, ['id', 'sets'] as const)
  implements UpdateTrainingExercise {}

export class UpdateSupersetDto implements UpdateSuperset {
  @ValidateNested({ each: true })
  @Type(() => UpdateTrainingExerciseDto)
  @ApiProperty({ type: () => UpdateTrainingExerciseDto, isArray: true })
  @Expose()
  exercises: UpdateTrainingExerciseDto[];
}

export class UpdateSubgroupDto
  extends PickType(Subgroup, [
    'id',
    'parentId',
    'name',
    'membersIds',
    'mainSet',
  ] as const)
  implements UpdateSubgroup
{
  @ValidateNested({ each: true })
  @Type(() => UpdateSupersetDto)
  @ApiProperty({ type: () => UpdateSupersetDto, isArray: true })
  @Expose()
  supersets: UpdateSupersetDto[];
}

export class UpdateTrainingComponentDto
  extends PickType(TrainingComponent, [
    'id',
    'target',
    'methodId',
    'mainSet',
  ] as const)
  implements Omit<UpdateTrainingComponent, 'from' | 'to'>
{
  @ValidateNested({ each: true })
  @Type(() => UpdateSupersetDto)
  @ApiProperty({ type: () => UpdateSupersetDto, isArray: true })
  @Expose()
  supersets: UpdateSupersetDto[];

  @ValidateNested({ each: true })
  @Type(() => UpdateSubgroupDto)
  @ApiProperty({ type: () => UpdateSubgroupDto, isArray: true })
  @Expose()
  subgroups: UpdateSubgroupDto[];
}

export class UpdateTrainingDto
  extends PickType(Training, ['warmup', 'cooldown'])
  implements UpdateTraining
{
  @ValidateNested({ each: true })
  @Type(() => UpdateTrainingComponentDto)
  @ApiProperty({ type: () => UpdateTrainingComponentDto, isArray: true })
  @Expose()
  components: UpdateTrainingComponentDto[];

  @ValidateNested({ each: true })
  @Type(() => Workload)
  @ApiProperty({ type: () => Workload, isArray: true })
  @Expose()
  workloads: Workload[]; // custom workloads
}
