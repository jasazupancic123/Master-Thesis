import { CommonService } from '@/common/service/common.service';
import { Exercise } from './entity/exercise.entity';
import { FilterExerciseQuery } from '@/exercise/type/exercise.type';
import { AppContextType } from '@/common/type/context.type';

const commonService = CommonService.instance;

export class ExerciseService {
  static filter(data: Exercise[], options: FilterExerciseQuery, components: AppContextType['components']): Exercise[] {
    const { ids, componentsIds, name, attributeValues } = options;

    let filtered = data;

    if (ids?.length)
      filtered = data.filter(exercise => ids.includes(exercise.id));

    if (componentsIds?.length) {
      const allComponentsIds: string[] = [];
      for (const componentId of componentsIds) {
        const component = components.flat.find((c) => c.id === componentId);
        if (!component) continue;

        // filter by root node
        allComponentsIds.push(component.id);

        // filter by all its children
        const tree = commonService.tree.fromArray(components.flat, {
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
        filtered = filtered.filter(exercise =>
          allComponentsIds.some(id => exercise.componentsIds.includes(id)),
        );
    }

    if (name)
      filtered = filtered.filter(exercise => exercise.name.toLowerCase().includes(name.toLowerCase()));

    if (attributeValues)
      throw new Error('not implemented yet');

    return filtered;
  }
}