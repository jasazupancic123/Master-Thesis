import { v4 } from 'uuid';

import {
  generateRandomName,
  generateRandomString,
} from '@src/common/utils/random.util';

import type { Target } from '../entity/target.entity';

export function generateTargetStub(data?: Partial<Target>): Target {
  return {
    id: data?.id || v4(),
    name: data?.name || data?.id || generateRandomName(),
    componentId: data?.componentId || generateRandomString(),
  };
}
