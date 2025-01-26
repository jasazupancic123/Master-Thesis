import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { BaseEntity } from '../../common/entity/base.entity';
import { User } from '../../common/type/firebase-auth.type';
import { Group } from './group.entity';

export class Subgroup extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @Expose()
  groupId: string;
  group?: Group; // virtual

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the subgroup
  members: User[]; // virtual

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  from: Date; // valid from

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  to: Date; // valid to
}
