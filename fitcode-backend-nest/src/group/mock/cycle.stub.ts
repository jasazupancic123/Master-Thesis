import { v4 } from 'uuid';
import { Cycle } from '../entity/cycle.entity';
import {
  generateRandomColor,
  generateRandomName,
} from '../../../test/common/utils/random.util';
import { endOfMonth, startOfMonth } from 'date-fns';

export function generateCycleStub(data?: Partial<Cycle>): Cycle {
  return {
    id: v4(),
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
