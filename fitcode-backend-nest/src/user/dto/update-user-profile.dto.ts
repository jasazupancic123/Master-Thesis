import { PartialType } from '@nestjs/mapped-types';
import { PickType } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';

export class UpdateUserProfileDto extends PartialType(
  PickType(UserEntity, [
    'sport',
    'level',
    'gender',
    'firstName',
    'lastName',
    'phone',
    'birthDate',
  ] as const),
) {}
