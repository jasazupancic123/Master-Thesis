import { PartialType } from '@nestjs/mapped-types';
import { PickType } from '@nestjs/swagger';

import { User } from '../entity/user.entity';

export class UpdateUserDto extends PartialType(
  PickType(User, [
    'displayName',
    'photoURL',
    'photoURLBase64',
    'sport',
    'level',
    'gender',
    'birthDate',
  ] as const),
) {}
