import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CustomClaimsDto } from '@src/auth/dto/custom-claims.dto';

import { AuthUser } from '../entities/user.entity';

export type CreateUser = AuthUser & { password: string };

export class CreateUserDto implements CreateUser {
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

  @Type(() => CustomClaimsDto)
  @ValidateNested()
  @ApiProperty({ type: () => CustomClaimsDto })
  @Expose()
  customClaims: CustomClaimsDto;
}
