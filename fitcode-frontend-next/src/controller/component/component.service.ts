import { CommonService } from '@/common/service/common.service';
import { Component, TreeComponent } from './type/component.type';

export class ComponentService {
  static toTree(components: Component[]): TreeComponent[] {
    return CommonService.instance.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    }) as unknown as TreeComponent[];
  }

  static toLeafs(components: Component[]): Component[] {
    return components.filter((c) => !c.children.length);
  }
}
