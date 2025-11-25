import { PickType } from '@nestjs/mapped-types';

import { Group } from '../entity/group.entity';

export class CreateGroupDto extends PickType(Group, [
  'name',
  'shortName',
  'membersIds',
  'institutionId',
  'trainerIds',
]) {}
