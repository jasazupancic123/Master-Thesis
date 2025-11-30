import { UserRole } from '../profile/enum/user-role.enum';
import type { Institution } from './type/institution.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export class InstitutionUtil {
  mapUsers<T extends Institution>(items: T[], users: AuthUser[]): T[] {
    return items.map((item: T) => {
      item.owner = users.find((user) => user.uid === item.ownerId)!;

      item.trainerIds = item.members
        .filter((m) => m.role === UserRole.TRAINER)
        .map((m) => m.id);

      item.athleteIds = item.members
        .filter((m) => m.role === UserRole.ATHLETE)
        .map((m) => m.id);

      item.trainers = users.filter((u) => item.trainerIds.includes(u.uid));
      item.athletes = users.filter((u) => item.athleteIds.includes(u.uid));
      return item;
    });
  }
}
