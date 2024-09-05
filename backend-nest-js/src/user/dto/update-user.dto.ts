import { PartialType, PickType } from '@nestjs/mapped-types';
import { CustomClaimsDto, UserDto } from './user.dto';

export class UpdateUserDto extends PartialType(PickType(UserDto, ['displayName'] as const)) {
}

export class UpdateUserClaimsDto extends PartialType(CustomClaimsDto) {
}