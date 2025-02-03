import { BaseEntity } from '../../common/entity/base.entity';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { TrainingComponent } from './training-component.entity';
import { Subgroup } from '../../group/entity/subgroup.entity';
import { Group } from '../../group/entity/group.entity';
import { Cycle } from '../../group/entity/cycle.entity';
import { IdEntity } from 'src/common/entity/id.entity';

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

  @IsObject()
  @ApiProperty()
  @Expose()
  bw: {
    // members' bodyweights used to calculate workloads
    [userId: string]: number;
  };

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

  @IsObject()
  @ApiProperty()
  @Expose()
  components: {
    [componentId: string]: TrainingComponent;
  };
}
