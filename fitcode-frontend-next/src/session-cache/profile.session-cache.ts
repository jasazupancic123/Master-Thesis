import type { User } from '@/core/user/type/user.type';

let cachedUser: User | null = null;
let cachedProfile: User | null = null;

export function getCachedUser(): User | null {
  return cachedUser;
}

export function setCachedUser(profile: User) {
  cachedUser = profile;
}

export function getCachedProfile(): User | null {
  return cachedProfile;
}

export function setCachedProfile(profile: User) {
  cachedProfile = profile;
}
