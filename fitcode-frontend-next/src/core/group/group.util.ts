import type { Group } from '../type/group.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export class GroupUtil {
  mapMembers(item: Group, users: AuthUser[]) {
    item.members = item.membersIds.map(
      (userId) => users.find(({ uid }) => uid === userId)!
    );

    return item;
  }
}
