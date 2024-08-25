import { PartialType, PickType } from '@nestjs/mapped-types';
import { UserDto } from './user.dto';
import { Filter } from '../../common/type/orm.type';

export class FilterUserDto extends PickType(PartialType(UserDto), ['email'] as const) implements Filter<UserDto> {
}
