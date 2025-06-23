import { v4 } from 'uuid';
import { generateRandomName } from '../../../test/common/utils/random.util';
import { Component } from '../entity/component.entity';

export function generateComponentStub(data?: Partial<Component>): Component {
  const id = data?.id || v4();

  return {
    id,
    name: data?.name || generateRandomName(),
    parentId: data?.parentId || null,
    parents: data?.parents || [],
    slug: id,
    targets: data?.targets || [],
    attributes: data?.attributes || undefined,
    params: data?.params || undefined,
  };
}
