import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { BaseEntity } from '@src/common/entity/base.entity';

export class InstitutionMember extends IntersectionType(BaseEntity) {
  @IsEnum(UserRole)
  @ApiProperty({ enum: UserRole })
  @Expose()
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  institutionId: string;
}
