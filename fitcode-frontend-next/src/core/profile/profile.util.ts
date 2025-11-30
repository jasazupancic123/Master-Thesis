import type { AuthUser } from '../auth/type/user.type';
import type { Profile } from './type/user.type';

export class ProfileUtil {
  userToProfile(user: AuthUser): Profile {
    return {
      uid: user.uid,
      email: user.email!,
      wellness: { userId: user.uid, date: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  getShortName(name: string): string {
    const shortName =
      name.split(' ').length > 1
        ? name.split(' ')[0] +
          ' ' +
          name
            ?.split(' ')
            .slice(1)
            .map((name) => name.toUpperCase())
            .join(' ')
        : name.toUpperCase();

    return shortName;
  }
}
