import type { Institution } from './type/institution.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export class InstitutionUtil {
  mapUsers(items: Institution[], users: AuthUser[]): Institution[] {
    return items.map((item: Institution) => {
      item.owner = users.find((user) => user.uid === item.ownerId)!;
      item.trainers = users.filter((u) => item.trainerIds.includes(u.uid));
      item.athletes = users.filter((u) => item.athleteIds.includes(u.uid));
      return item;
    });
  }
}
