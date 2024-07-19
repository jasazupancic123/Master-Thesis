import { PartialType, PickType } from '@nestjs/mapped-types';
import { UserDto } from './user.dto';

export class FilterUserDto extends PickType(PartialType(UserDto), ['email'] as const) {}