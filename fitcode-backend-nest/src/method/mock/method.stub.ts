import { v4 } from 'uuid';

import { generateRandomName } from '@src/common/utils/random.util';

import type { Method } from '../entity/method.entity';

export function generateMethodStub(data?: Partial<Method>): Method {
  return {
    id: data?.id || v4(),
    name: data?.name || generateRandomName(),
    ability: data?.ability || generateRandomName(),
    componentId: data?.componentId,
    attributes: data?.attributes || [],
    intensity: data?.intensity || '100%',
    tempo: data?.tempo || '1',
    recovery: data?.recovery || '60',
    repetition: data?.repetition || '12',
    set: data?.set || '5',
  };
}
