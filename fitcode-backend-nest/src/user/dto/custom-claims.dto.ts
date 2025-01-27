import { CustomClaims } from '../../common/type/firebase-auth.type';
import { IsEnum } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CustomClaimsDto implements CustomClaims {
  @IsEnum(UserRole, { each: true })
  @Expose()
  @ApiProperty({ example: [UserRole.ATHLETE] })
  role: UserRole[];
}