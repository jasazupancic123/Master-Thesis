import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { UserRole } from '@src/auth/enum/user-role.enum';

export class CustomClaimsDto {
  @IsEnum(UserRole, { each: true })
  @ApiProperty({ enum: UserRole, isArray: true })
  role: UserRole[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  faceFrontUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  faceLeftUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  faceRightUrl?: string;
}

export class UpdateCustomClaimsDto extends PartialType(CustomClaimsDto) {}
