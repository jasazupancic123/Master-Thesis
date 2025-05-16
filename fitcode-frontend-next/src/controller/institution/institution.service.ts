import { User } from '../user/type/user.type';
import { Institution } from './type/institution.type';

export class InstitutionService {
  static mapAllUsers(items: Institution[], users: User[]): Institution[] {
    const mappedItems = items.map((item: Institution) => {
      const owner = users.find((user) => user.uid === item.ownerId)!;
      const trainers = users.filter((user) =>
        item.trainerIds.includes(user.uid)
      );
      const athletes = users.filter((user) =>
        item.athleteIds.includes(user.uid)
      );

      return {
        ...item,
        owner: owner,
        trainers: trainers || [],
        athletes: athletes || [],
      };
    });

    return mappedItems;
  }
}
