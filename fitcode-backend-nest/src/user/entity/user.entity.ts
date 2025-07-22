import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';
import { CustomClaims, User } from '@src/common/type/firebase-auth.type';

import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';

export class UserEntity extends BaseEntity {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  sport?: string;

  @IsEnum(SportLevel)
  @IsOptional()
  @Expose()
  @ApiProperty({ enum: SportLevel })
  level?: SportLevel;

  @IsEnum(Gender)
  @IsOptional()
  @ApiPropertyOptional({ enum: Gender })
  @Expose()
  gender?: Gender;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  profileImageUrl?: string;

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
