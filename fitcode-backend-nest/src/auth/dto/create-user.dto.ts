import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { User } from '@src/user/entity/user.entity';

export class CreateUserDto extends PickType(User, [
  'email',
  'displayName',
  'photoURL',
  'photoURLBase64',
  'sport',
  'level',
  'gender',
  'birthDate',
  'role',
] as const) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  password: string;
}
