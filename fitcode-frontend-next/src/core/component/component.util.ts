import type { Component, TreeComponent } from './type/component.type';
import { lib } from '@/lib';

export class ComponentUtil {
  tree(components: Component[]): TreeComponent[] {
    return lib.common.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    }) as unknown as TreeComponent[];
  }
}
