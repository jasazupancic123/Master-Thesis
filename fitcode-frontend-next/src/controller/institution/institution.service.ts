import type { AuthUser } from '../auth/type/user.type';
import type { Institution } from './type/institution.type';

export class InstitutionService {
  static mapUsers(items: Institution[], users: AuthUser[]): Institution[] {
    return items.map((item: Institution) => {
      const owner = users.find((user) => user.uid === item.ownerId)!;
      const trainers = users.filter((u) => item.trainerIds.includes(u.uid));
      const athletes = users.filter((u) => item.athleteIds.includes(u.uid));
      return { ...item, owner, trainers, athletes };
    });
  }
}
