import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CreateUserDto } from '@src/auth/dto/create-user.dto';

import { Profile } from '../entity/profile.entity';

export class ImportUserDto extends IntersectionType(
  CreateUserDto,
  PickType(Profile, ['sport', 'level', 'gender', 'birthDate'] as const),
) {}

export class ImportUsersDto {
  @ValidateNested({ each: true })
  @Type(() => ImportUserDto)
  @ApiProperty({ type: ImportUserDto, isArray: true })
  @Expose()
  users: ImportUserDto[];
}
