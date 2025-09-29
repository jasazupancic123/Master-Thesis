import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { AuthUser } from '../entities/user.entity';
import { UserRole } from '../enum/user-role.enum';

export type CreateUser = AuthUser & { password: string };

export class CreateUserDto implements Omit<CreateUser, 'customClaims'> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  uid: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  photoURL?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  @ApiProperty({ enum: UserRole })
  @Expose()
  role: UserRole;
}
