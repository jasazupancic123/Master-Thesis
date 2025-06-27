import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { TrainingComponent } from './training-component.entity';
import { Wellness } from '../../user/entity/wellness.entity';
import { GroupWorkloadStats } from './average-workload-values.entity';
import { Institution } from '../../institution/entity/institution.entity';

export class Training extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  institutionId?: string;
  institution?: Institution | null;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  cycleId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  ownerId: string; // owner of the group

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the group

  @ApiProperty()
  @Expose()
  completedMembersIds: string[]; // members who completed the training

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  copiedFromId?: string; // if this training is copied from another training

  @ValidateNested({ each: true })
  @Type(() => GroupWorkloadStats)
  @ApiProperty()
  @Expose()
  stats: GroupWorkloadStats[]; // average group workload stats

  @ValidateNested({ each: true })
  @Type(() => GroupWorkloadStats)
  @ApiProperty()
  @Expose()
  futureStats: GroupWorkloadStats[]; // average future group workload stats

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @ValidateNested()
  @Type(() => TrainingComponent)
  @ApiProperty()
  @Expose()
  warmup: TrainingComponent; // warmup component

  @ValidateNested()
  @Type(() => TrainingComponent)
  @ApiProperty()
  @Expose()
  cooldown: TrainingComponent; // cooldown component

  @ValidateNested({ each: true })
  @Type(() => TrainingComponent)
  @ApiProperty()
  @Expose()
  components: TrainingComponent[];

  @ValidateNested({ each: true })
  @Type(() => Wellness)
  @ApiProperty()
  @Expose()
  wellness: Wellness[]; // members' wellness info used to calculate workloads
}
