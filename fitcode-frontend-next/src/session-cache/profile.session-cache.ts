import type { User } from '@/controller/user/type/user.type';

let cachedProfile: User | null = null;

export function getCachedProfile() {
  return cachedProfile;
}

export function setCachedProfile(profile: User) {
  cachedProfile = profile;
}
