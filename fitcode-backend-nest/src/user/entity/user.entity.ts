import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { CustomClaims, User } from '../../common/type/firebase-auth.type';
import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';

export class UserEntity extends BaseEntity {
  @IsString({ each: true })
  @Expose()
  @ApiProperty()
  groupsIds: string[]; // array of group ids user is owner or member of

  @IsString({ each: true })
  @Expose()
  @ApiProperty()
  trainersIds: string[]; // for athlete, this is a list of trainer ids, and for trainer, this is a list of manager ids

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  sport?: string;

  @IsEnum(SportLevel)
  @IsOptional()
  @Expose()
  @ApiProperty({ example: SportLevel.BEGINNER })
  level?: SportLevel;

  @IsEnum(Gender)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  gender?: Gender;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  birthDate?: Date;
}

export type CreateUser = Pick<User, 'email' | 'displayName'> & {
  password: string;
} & { customClaims: CustomClaims };
