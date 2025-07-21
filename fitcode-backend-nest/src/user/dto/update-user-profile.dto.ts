import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateUserProfileDto extends PartialType(
  PickType(UserEntity, [
    'sport',
    'level',
    'gender',
    'profileImageUrl',
    'firstName',
    'lastName',
    'phone',
    'birthDate',
  ] as const),
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;
}
