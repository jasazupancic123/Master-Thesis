import dayjs from 'dayjs';

import type { Cycle } from './type/cycle.type';
import type { Group } from './type/group.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export class GroupUtil {
  mapMembers(item: Group, users: AuthUser[]) {
    item.members = item.membersIds
      .map((userId) => users.find(({ uid }) => uid === userId)!)
      .filter(Boolean);

    item.trainers = item.trainerIds
      .map((userId) => users.find(({ uid }) => uid === userId)!)
      .filter(Boolean);

    return item;
  }

  getGroupsWithCurrentActiveCycles(groups: Group[]): Group[] {
    return groups.filter(
      (group) => this.getCurrentActiveCycle(group) !== undefined
    );
  }

  getCurrentActiveCycle(group: Group): Cycle | undefined {
    const now = new Date();

    const activeCycle = group.cycles.find(
      (cycle) => dayjs(cycle.from).isBefore(now) && dayjs(cycle.to).isAfter(now)
    );

    return activeCycle;
  }
}
