import type { CycleLevel } from '../enum/cycle-level.enum';

export type CycleTarget = {
  targetId: string;
  level?: CycleLevel;
};
