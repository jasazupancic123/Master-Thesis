import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { CustomClaims } from '@src/common/type/firebase-auth.type';

import { UserRole } from '../enum/user-role.enum';

export class CustomClaimsDto implements CustomClaims {
  @IsEnum(UserRole, { each: true })
  @Expose()
  @ApiProperty({ example: [UserRole.ATHLETE] })
  role: UserRole[];
}
