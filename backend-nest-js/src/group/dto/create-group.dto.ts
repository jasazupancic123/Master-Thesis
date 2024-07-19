import { GroupDto } from './group.dto';
import { PickType } from '@nestjs/mapped-types';

export class CreateGroupDto extends PickType(GroupDto, ['name', 'memberIds']) {}