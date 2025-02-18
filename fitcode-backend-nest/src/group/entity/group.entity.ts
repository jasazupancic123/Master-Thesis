import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Timestamp } from 'firebase-admin/firestore';
import { BaseEntity } from '../../common/entity/base.entity';
import { Cycle, CycleFirestore } from './cycle.entity';

export class Group extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @Expose()
  ownerId: string; // owner of the group

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the group

  @ValidateNested({ each: true })
  @Type(() => Cycle)
  @IsOptional()
  @ApiProperty()
  @Expose()
  cycles: Cycle[]; // array
}

export type GroupFirestore = {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp;
  name: string;
  ownerId: string;
  membersIds: string[];
  cycles: CycleFirestore[];
};
