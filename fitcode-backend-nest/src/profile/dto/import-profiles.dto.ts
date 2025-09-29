import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CreateUserDto } from '@src/auth/dto/create-user.dto';

import { Profile } from '../entity/profile.entity';

export class ImportProfileDto extends IntersectionType(
  CreateUserDto,
  PickType(Profile, [
    'customId',
    'sport',
    'level',
    'gender',
    'birthDate',
  ] as const),
) {}

export class ImportProfilesDto {
  @ValidateNested({ each: true })
  @Type(() => ImportProfileDto)
  @ApiProperty({ type: ImportProfileDto, isArray: true })
  @Expose()
  profiles: ImportProfileDto[];
}
