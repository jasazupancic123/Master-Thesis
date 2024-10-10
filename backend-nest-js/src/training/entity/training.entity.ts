import { BaseEntity } from '../../common/entity/base.entity';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { TrainingComponent } from './training-component.entity';
import { Subgroup } from '../../group/entity/subgroup.entity';
import { Group } from '../../group/entity/group.entity';
import { Cycle } from '../../group/entity/cycle.entity';

export class Training extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId: string;
  group?: Group;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId: string;
  cycle?: Cycle;

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

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string;
  subgroup?: Subgroup;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  copiedFromId?: string; // if this training is copied from another training

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

  @ValidateNested({ each: true })
  @Type(() => TrainingComponent)
  @ApiProperty()
  @Expose()
  components: TrainingComponent[];
}
