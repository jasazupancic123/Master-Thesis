import type { User, UserEntity } from '@/controller/user/type/user.type';

let cachedUser: User | null = null;
let cachedProfile: UserEntity | null = null;

export function getCachedUser(): User | null {
  return cachedUser;
}

export function setCachedUser(profile: User) {
  cachedUser = profile;
}

export function getCachedProfile(): UserEntity | null {
  return cachedProfile;
}

export function setCachedProfile(profile: UserEntity) {
  cachedProfile = profile;
}
