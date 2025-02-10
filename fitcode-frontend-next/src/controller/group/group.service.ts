import { User } from '../user/type/user.type';
import { Group } from './type/group.type';

export class GroupService {
  static mapMembers(item: Group, users: User[]) {
    item.members = item.membersIds.map(
      (userId) => users.find(({ uid }) => uid === userId)!
    );

    return item.members;
  }
}
