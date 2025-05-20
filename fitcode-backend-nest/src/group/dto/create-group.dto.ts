import { PickType } from '@nestjs/mapped-types';
import { Group } from '../entity/group.entity';

// NOTE - `ownerId` is inferred from request user
export class CreateGroupDto extends PickType(Group, ['name', 'membersIds', 'institutionId']) {}