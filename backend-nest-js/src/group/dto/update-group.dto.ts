import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';
import { UpdateGroup } from '../type/group.type';

export class UpdateGroupDto
  extends PartialType(CreateGroupDto)
  implements UpdateGroup {}
