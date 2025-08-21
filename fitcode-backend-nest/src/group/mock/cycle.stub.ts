import { addDays, endOfMonth, startOfMonth } from 'date-fns';
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

export function generateCyclesStub(
  count: number,
  from: Date = new Date(),
  lengthInDays: number = 7,
): Cycle[] {
  return Array.from({ length: count }, (_, i) =>
    generateCycleStub({
      id: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      from: addDays(from, i * lengthInDays),
      to: addDays(from, (i + 1) * lengthInDays),
      name: generateRandomName(),
    }),
  );
}
