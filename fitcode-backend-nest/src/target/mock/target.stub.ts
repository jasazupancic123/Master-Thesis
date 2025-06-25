import { v4 } from 'uuid';
import { Target } from '../entity/target.entity';
import {
  generateRandomName,
  generateRandomString,
} from '../../../test/common/utils/random.util';

export function generateTargetStub(data?: Partial<Target>): Target {
  return {
    id: data?.id || v4(),
    name: data?.name || data?.id || generateRandomName(),
    componentId: data?.componentId || generateRandomString(),
    color: data?.color,
  };
}
