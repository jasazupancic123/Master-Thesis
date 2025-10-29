import type { AuthUser } from '../auth/type/user.type';
import type { Profile } from './type/user.type';

export class ProfileUtil {
  userToProfile(user: AuthUser): Profile {
    return {
      uid: user.uid,
      email: user.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
