import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { Profile } from '../entity/profile.entity';

export class UpdateProfileDto extends PartialType(
  PickType(Profile, [
    'customId',
    'sport',
    'level',
    'gender',
    'birthDate',
  ] as const),
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;
}
