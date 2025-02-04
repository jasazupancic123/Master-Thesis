import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { User } from '../../common/type/firebase-auth.type';
import { BaseEntity } from '../../common/entity/base.entity';
import { Subgroup } from './subgroup.entity';
import { Cycle } from './cycle.entity';

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
  members: User[] | null;

  availableMembersIds: string[]; // available members for subgroups

  @ValidateNested({ each: true })
  @Type(() => Cycle)
  @IsOptional()
  @ApiProperty()
  @Expose()
  cycles: Cycle[]; // array

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @IsOptional()
  @ApiProperty()
  @Expose()
  subgroups: Subgroup[]; // sub-collection
}
