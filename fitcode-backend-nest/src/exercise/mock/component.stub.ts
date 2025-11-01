import { generateAttributeStub } from '@src/attribute/mock/attribute.stub';

import type { Component } from '../entity/component.entity';

export function generateComponentStub(data?: Partial<Component>): Component {
  return {
    ...generateAttributeStub(data),
    attributes: data?.attributes,
    params: data?.params,
  } as Component;
}
