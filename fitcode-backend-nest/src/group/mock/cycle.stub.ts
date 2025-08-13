import { endOfMonth, startOfMonth } from 'date-fns';
import { v4 } from 'uuid';

import {
  generateRandomColor,
  generateRandomName,
} from '@src/common/utils/random.util';

import type { Cycle } from '../entity/cycle.entity';

export function generateCycleStub(data?: Partial<Cycle>): Cycle {
  return {
    id: data?.id || v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    color: data?.color ?? generateRandomColor(),
    name: data?.name ?? generateRandomName(),
    from: data?.from ?? startOfMonth(new Date()),
    to: data?.to ?? endOfMonth(new Date()),
    selectedTargets: data?.selectedTargets ?? [],
  };
}
