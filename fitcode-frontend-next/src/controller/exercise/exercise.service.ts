import { CommonService } from '@/common/service/common.service';
import { Exercise } from './type/exercise.type';
import { Component } from '../component/type/component.type';

const commonService = CommonService.instance;

export class ExerciseService {
  static filter(
    data: Exercise[],
    options: {
      ids?: string[];
      componentsIds?: string[];
      name?: string;
      attributeValues?: Record<string, any>;
    },
    components: Component[]
  ): Exercise[] {
    const { ids, componentsIds, name, attributeValues } = options;
    let filtered = data;

    // filter by ids
    if (ids?.length)
      filtered = data.filter((exercise) => ids.includes(exercise.id));

    // filter by  components
    if (componentsIds?.length) {
      const allComponentsIds: string[] = [];

      for (const componentId of componentsIds) {
        const component = components.find((c) => c.id === componentId);
        if (!component) continue;

        // filter by root node
        allComponentsIds.push(component.id);

        // filter by all its children
        const tree = commonService.tree.fromArray(components, {
          rootId: component.id,
          idPropertyName: 'id',
          parentIdPropertyName: 'parent',
          childrenPropertyName: 'children',
        });

        commonService.tree.forEach(tree, 'children', (item) => {
          allComponentsIds.push(item.id);
          return null;
        });
      }

      if (allComponentsIds.length)
        filtered = filtered.filter((exercise) =>
          allComponentsIds.some((id) => exercise.componentsIds.includes(id))
        );
    }

    if (name)
      filtered = filtered.filter((exercise) =>
        exercise.name.toLowerCase().includes(name.toLowerCase())
      );

    if (attributeValues) throw new Error('not implemented yet');

    return filtered;
  }

  static mapAttributes(item: Exercise): Exercise {
    item.attributeValues = commonService.object.flattenObject(
      item.attributeValues
    );

    return item;
  }

  static mapComponents(item: Exercise, components: Component[]): Exercise {
    item.components = components.filter(({ id }) =>
      item.componentsIds.includes(id)
    );

    item.rootComponents = components.map((component) =>
      commonService.tree.getRoot(component, components)
    );

    return item;
  }
}
