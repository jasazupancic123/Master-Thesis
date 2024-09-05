import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportLevel } from '../enum/sport-level.enum';
import { CustomClaims } from '../../common/type/firebase-auth.type';

export class CustomClaimsDto implements CustomClaims {
  @IsEnum(UserRole, { each: true })
  @Expose()
  @ApiProperty({ example: [UserRole.ATHLETE] })
  role: UserRole[];

  @IsEnum(SportLevel)
  @Expose()
  @ApiProperty({ example: SportLevel.BEGINNER })
  level: SportLevel;

  @IsNumber()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({ example: 70.5 })
  bodyweight?: number;
}

export class UserDto {
  @IsString()
  @Expose()
  @ApiProperty()
  uid: string;

  @IsEmail()
  @Expose()
  @ApiProperty({ example: 'john.doe@mail.com' })
  email: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({ example: true })
  emailVerified: boolean;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({ example: 'John Doe' })
  displayName?: string;

  @ValidateNested()
  @Type(() => CustomClaimsDto)
  @Expose()
  customClaims: CustomClaimsDto;
}

export type CreateUser = Pick<UserDto, 'email' | 'displayName' | 'customClaims'> & { password: string };