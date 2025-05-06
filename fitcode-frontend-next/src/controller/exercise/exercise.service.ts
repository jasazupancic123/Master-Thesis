import { CommonService } from '@/common/service/common.service';
import { Pagination } from '@/common/type/paginate.type';
import { SetState } from '@/common/type/state.type';
import { Component } from '../component/type/component.type';
import { Exercise } from './type/exercise.type';

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
          parentIdPropertyName: 'parentId',
          childrenPropertyName: 'children',
        });

        commonService.tree.forEach(tree, 'children', (item) => {
          allComponentsIds.push(item.id);
          return null;
        });
      }

      if (allComponentsIds.length)
        filtered = filtered.filter((exercise) =>
          allComponentsIds.some((id) => exercise.componentIds.includes(id))
        );
    }

    if (name)
      filtered = filtered.filter((exercise) =>
        exercise.name.toLowerCase().includes(name.toLowerCase())
      );

    if (attributeValues) throw new Error('not implemented yet');

    return filtered;
  }

  static paginate(
    filter: {
      componentsIds: string[];
      name?: string;
    },
    state: {
      pagination: Pagination;
      exercises: Exercise[];
      components: Component[];
      setFilteredExercises: SetState<Exercise[]>;
      setPagination: SetState<Pagination>;
    }
  ) {
    const {
      pagination,
      exercises,
      components,
      setFilteredExercises,
      setPagination,
    } = state;

    let filtered
    if(filter.componentsIds.includes('warmup') || filter.componentsIds.includes('cooldown')) 
      filtered = [...exercises] // all exercises for warmup and cooldown
    else 
      filtered = ExerciseService.filter(exercises, filter, components);
    const total = filtered.length;

    // paginate
    const pages = Math.ceil(total / pagination.pageSize);
    const page = pages < pagination.pages ? 1 : pagination.page;

    filtered = CommonService.instance.generic.paginate(filtered, {
      page,
      pageSize: pagination.pageSize,
      orderBy: { field: 'name', value: 'asc' },
    });

    // populate exercises
    filtered.map((exercise) => {
      ExerciseService.mapComponents(
        ExerciseService.mapAttributes(exercise),
        components
      );
    });

    setFilteredExercises(filtered);
    setPagination((prev) => ({
      ...prev,
      total,
      pages: Math.ceil(total / pagination.pageSize),
    }));
  }

  static mapAttributes(item: Exercise): Exercise {
    // item.valuesObject = commonService.object.flattenObject(item.valuesObject);

    return item;
  }

  static mapComponents(item: Exercise, components: Component[]): Exercise {
    item.components = components.filter(({ id }) =>
      item.componentIds.includes(id)
    );

    item.rootComponents = components.map((component) =>
      commonService.tree.getRoot(component, components)
    );

    return item;
  }
}
