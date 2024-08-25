import { Group } from '../entity/group.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreateGroupDto extends PickType(Group, ['name', 'memberIds', 'parentId', 'validUntil']) {
}