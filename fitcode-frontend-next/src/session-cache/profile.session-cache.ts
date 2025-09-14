import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Profile } from '@/controller/profile/type/user.type';

let cachedUser: AuthUser | null = null;
let cachedProfile: Profile | null = null;

export function getCachedUser(): AuthUser | null {
  return cachedUser;
}

export function setCachedUser(profile: AuthUser) {
  cachedUser = profile;
}

export function getCachedProfile(): Profile | null {
  return cachedProfile;
}

export function setCachedProfile(profile: Profile) {
  cachedProfile = profile;
}
