import type { Institution } from './type/institution.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export class InstitutionUtil {
  mapUsers<T extends Institution>(items: T[], users: AuthUser[]): T[] {
    return items.map((item: T) => {
      item.owner = users.find((user) => user.uid === item.ownerId)!;
      item.trainers = users.filter((u) => item.trainerIds.includes(u.uid));
      item.athletes = users.filter((u) => item.athleteIds.includes(u.uid));
      return item;
    });
  }
}
