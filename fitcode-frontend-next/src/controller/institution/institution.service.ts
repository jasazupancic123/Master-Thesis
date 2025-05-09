import { UserRole } from '../user/enum/user-role.enum';
import { Institution } from './type/institution.type';

export class InstitutionService {
  static getManagers(item: Institution) {
    if (!item.members) throw new Error('Populate members array first');
    return item.members.map((m) =>
      m.customClaims.role.includes(UserRole.MANAGER)
    );
  }

  static getTrainers(item: Institution) {
    if (!item.members) throw new Error('Populate members array first');
    return item.members.map((m) =>
      m.customClaims.role.includes(UserRole.TRAINER)
    );
  }

  static getAthletes(item: Institution) {
    if (!item.members) throw new Error('Populate members array first');
    return item.members.map((m) =>
      m.customClaims.role.includes(UserRole.ATHLETE)
    );
  }
}
