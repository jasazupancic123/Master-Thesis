import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { UserEntity } from '../entity/user.entity';

export class UpdateUserProfileDto extends PartialType(
  PickType(UserEntity, [
    'sport',
    'level',
    'gender',
    'profileImageUrl',
    'firstName',
    'lastName',
    'birthDate',
  ] as const),
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;
}
