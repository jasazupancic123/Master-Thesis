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
import { UserMeta } from 'src/user/entity/user-meta.entity';

export class Training extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId: string;

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

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  copiedFromId?: string; // if this training is copied from another training

  @IsObject()
  @ApiProperty()
  @Expose()
  components: {
    [componentId: string]: TrainingComponent;
  };

  @ValidateNested({ each: true })
  @Type(() => TrainingSubgroup)
  @ApiProperty()
  @Expose()
  subgroups: TrainingSubgroup[];

  @IsObject()
  @ApiProperty()
  @Expose()
  meta: {
    // members' meta used to calculate workloads
    [userId: string]: UserMeta;
  };
}

export class TrainingSubgroup extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the sub-training (at least 1)

  @IsObject()
  @ApiProperty()
  @Expose()
  components: {
    // separate training plan, initially copied from parent training
    [componentId: string]: TrainingComponent;
  };
}
