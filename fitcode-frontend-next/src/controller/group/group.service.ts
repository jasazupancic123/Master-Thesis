import { User } from '../user/type/user.type';
import { Group } from './type/group.type';

export class GroupService {
  static mapMembers(item: Group, users: User[], returnGroup: true): Group;
  static mapMembers(item: Group, users: User[], returnGroup?: false): User[];
  static mapMembers(
    item: Group,
    users: User[],
    returnGroup = false
  ): Group | User[] {
    item.members = item.membersIds.map(
      (userId) => users.find(({ uid }) => uid === userId)!
    );

    return returnGroup ? item : item.members;
  }
}
