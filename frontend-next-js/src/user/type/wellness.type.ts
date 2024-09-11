import { Wellness } from '@/user/entity/wellness.entity';

export function isWellness(data: any): data is Wellness {
  return data && 'createdAt' in data && 'updatedAt' in data;
}

export type CreateWellness = Pick<Wellness, 'sleep' | 'fatigue' | 'soreness' | 'comment'>;