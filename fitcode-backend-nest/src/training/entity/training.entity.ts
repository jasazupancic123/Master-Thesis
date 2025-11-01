import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';
import { Cycle } from '@src/group/entity/cycle.entity';
import { Group } from '@src/group/entity/group.entity';
import { Institution } from '@src/institution/entity/institution.entity';

import { TrainingComponent } from './training-component.entity';

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
  group?: Group | null;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  cycleId?: string;
  cycle?: Cycle | null;

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
  @ApiProperty({ type: () => TrainingComponent, isArray: true })
  @Expose()
  components: TrainingComponent[];
}
