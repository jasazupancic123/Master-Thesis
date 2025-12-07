import { IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { UserRole } from '@src/auth/enum/user-role.enum';

import type { UserType } from '../type/user.type';
import { Profile } from './profile.entity';

// Full user entity combining authentication and profile details
export class User extends IntersectionType(Profile) implements UserType {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  displayName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  photoURL?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  @Expose()
  role: UserRole;
}
