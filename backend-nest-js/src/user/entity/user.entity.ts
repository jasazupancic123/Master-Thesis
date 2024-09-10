import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../common/type/firebase-auth.type';
import { Group } from '../../group/entity/group.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { Wellness } from './wellness.entity';
import { Bodyweight } from './body-weight.entity';
import { BaseEntity } from '../../common/entity/base.entity';
import { SportLevel } from '../enum/sport-level.enum';

export class UserEntity extends BaseEntity {
  @IsEnum(SportLevel)
  @Expose()
  @ApiProperty({ example: SportLevel.BEGINNER })
  level: SportLevel;

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
  @Type(() => Exercise)
  @IsOptional()
  @ApiProperty()
  @Expose()
  exercises: Exercise[]; // sub collection

  @ValidateNested({ each: true })
  @Type(() => Wellness)
  @IsOptional()
  @ApiProperty()
  @Expose()
  wellness: Wellness[]; // sub collection
}

export type CreateUser = Pick<
  User,
  'email' | 'displayName' | 'customClaims'
> & { password: string; weight: number };
