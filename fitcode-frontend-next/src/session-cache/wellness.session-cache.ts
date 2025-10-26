import type { Wellness } from '@/core/profile/type/wellness.type';

let cachedWellness: Wellness | null = null;

export function getCachedWellness() {
  return cachedWellness;
}

export function setCachedWellness(wellness: Wellness) {
  cachedWellness = wellness;
}
