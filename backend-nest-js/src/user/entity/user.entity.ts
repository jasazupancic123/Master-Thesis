import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../common/type/firebase-auth.type';
import { Group } from '../../group/entity/group.entity';
import { Wellness } from './wellness.entity';
import { Bodyweight } from './body-weight.entity';
import { BaseEntity } from '../../common/entity/base.entity';
import { SportLevel } from '../enum/sport-level.enum';

export class UserEntity extends BaseEntity {
  @IsEnum(SportLevel)
  @Expose()
  @ApiProperty({ example: SportLevel.BEGINNER })
  level: SportLevel;

  @IsString({ each: true })
  @Expose()
  @ApiProperty()
  groupsIds: string[]; // array of group ids user is owner or member of

  @ValidateNested({ each: true })
  @Type(() => Bodyweight)
  @IsOptional()
  @ApiProperty()
  @Expose()
  bodyweight: Bodyweight[]; // array of bodyweight, not sub collection

  @ValidateNested({ each: true })
  @Type(() => Group)
  @IsOptional()
  @ApiProperty()
  @Expose()
  groups: Group[]; // sub collection

  @ValidateNested({ each: true })
  @Type(() => Wellness)
  @IsOptional()
  @ApiProperty()
  @Expose()
  wellness: Wellness[]; // sub collection
}

export type CreateUser = Pick<User, 'email' | 'displayName'> & {
  password: string;
};
