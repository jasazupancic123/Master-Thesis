import { IsString, IsEmail, IsBoolean, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportLevel } from '../enum/sport-level.enum';
import { PickType } from '@nestjs/mapped-types';
import { Entity } from '../../common/decorator/entity.decorator';

export class CustomClaimsDto {
  @IsEnum(UserRole, { each: true })
  @Expose()
  @ApiProperty({ example: [UserRole.ATHLETE] })
  role: UserRole[]

  @IsEnum(SportLevel)
  @Expose()
  @ApiProperty({ example: SportLevel.BEGINNER })
  level: SportLevel
}

@Entity('user')
export class UserDto {
  @IsString()
  @Expose()
  @ApiProperty({ example: '7SvqOiB1dwMi9ms8UmFeGRYk2m2Z'})
  uid: string

  @IsEmail()
  @Expose()
  @ApiProperty({ example: 'john.doe@mail.com'})
  email: string

  @IsBoolean()
  @Expose()
  @ApiProperty({ example: true })
  emailVerified: boolean

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({ example: 'John Doe'})
  displayName?: string

  @ValidateNested()
  @Type(() => CustomClaimsDto)
  @Expose()
  customClaims: CustomClaimsDto
}

export class PublicUserDto extends PickType(UserDto, ['uid', 'email', 'displayName']) {}