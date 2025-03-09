import { v4 } from 'uuid';
import { generateRandomName } from '../utils/random.util';
import { Component } from '../../src/component/entity/component.entity';

export function generateComponentStub(data?: Partial<Component>): Component {
  const id = v4();
  return {
    id,
    name: data?.name || generateRandomName(),
    parentId: data?.parentId || null,
    slug: id,
    attributes: data?.attributes || undefined,
    params: data?.params || undefined,
  };
}
