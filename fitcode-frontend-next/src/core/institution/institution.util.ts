import { UserRole } from '../user/enum/user-role.enum';
import type { User } from '../user/type/user.type';
import type { Institution } from './type/institution.type';

export class InstitutionUtil {
  mapUsers<T extends Institution>(items: T[], users: User[]): T[] {
    return items.map((item: T) => {
      item.owner = users.find((user) => user.uid === item.ownerId)!;

      const trainerIds = item.members
        .filter((m) => m.role === UserRole.TRAINER)
        .map((m) => m.id);

      const athleteIds = item.members
        .filter((m) => m.role === UserRole.ATHLETE)
        .map((m) => m.id);

      item.trainers = users.filter((u) => trainerIds.includes(u.uid));
      item.athletes = users.filter((u) => athleteIds.includes(u.uid));
      return item;
    });
  }
}
