import type { AuthUser } from '../auth/type/user.type';
import type { Cycle } from './type/cycle.type';
import type { Group } from './type/group.type';

export class GroupService {
  static mapMembers(item: Group, users: AuthUser[]) {
    item.members = item.membersIds.map(
      (userId) => users.find(({ uid }) => uid === userId)!
    );

    return item;
  }

  static getCyclesForSelect(
    cycles: Cycle[]
  ): { label: string; value: string }[] {
    return cycles.map((cycle) => ({ label: cycle.name, value: cycle.id }));
  }
}
