import { Wellness } from '../entity/wellness.entity';

export type CreateWellness = Pick<
  Wellness,
  'sleep' | 'fatigue' | 'soreness' | 'comment'
>;
