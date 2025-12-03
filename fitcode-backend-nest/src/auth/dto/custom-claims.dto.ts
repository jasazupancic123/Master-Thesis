import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { UserRole } from '@src/auth/enum/user-role.enum';

export class CustomClaimsDto {
  @IsEnum(UserRole, { each: true })
  @ApiProperty({ enum: UserRole, isArray: true })
  role: UserRole[];
}

export class UpdateCustomClaimsDto extends PartialType(CustomClaimsDto) {}
