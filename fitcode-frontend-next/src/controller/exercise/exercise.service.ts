import type { Component } from '../component/type/component.type';
import type { Exercise } from './type/exercise.type';
import type { ExerciseAttributeValue } from './type/exercise-attribute-value.type';
import { CommonService } from '@/common/service/common.service';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState } from '@/common/type/state.type';

const commonService = CommonService.instance;

export class ExerciseService {
  /**
   * Frontend filter for exercises (this will be moved )
   */
  static filter(
    data: Exercise[],
    options: {
      ids?: string[];
      componentsIds?: string[];
      name?: string;
      attributeValues?: Record<string, unknown>;
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

    let filtered;
    if (
      filter.componentsIds.includes('warmup') ||
      filter.componentsIds.includes('cooldown')
    )
      filtered = [...exercises]; // all exercises for warmup and cooldown
    else filtered = ExerciseService.filter(exercises, filter, components);
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
    item.valuesObject = commonService.object.flattenObject(
      ExerciseService.attributeValuesToNestedObject(item.attributeValues || [])
    );

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

  /**
   * Converts a nested object into a colon-separated string path starting from the root key.
   *
   * @example
   * parseAttributeValue({ a: 'b', b: 'c', c: 1 }, 'a') // => { a: "b:c:1" }
   * parseAttributeValue({ x: 'y', y: 'z', z: 100 }, 'x') // => { x: "y:z:100" }
   */
  static parseAttributeValue<T extends Record<string, unknown>>(
    obj: T,
    rootKey: keyof T
  ): Record<string, string> {
    const result: Record<string, string> = {};
    const pathParts: string[] = [];

    let currentKey: string | undefined = String(rootKey);
    let currentValue: unknown = obj[currentKey];

    while (
      typeof currentValue === 'string' &&
      obj[currentValue] !== undefined
    ) {
      pathParts.push(currentValue);
      currentKey = currentValue;
      currentValue = obj[currentKey];
    }

    if (currentValue !== undefined) pathParts.push(String(currentValue));
    result[String(rootKey)] = pathParts.join(':');

    return result;
  }

  /**
   * Converts ExerciseAttributeValue array to a nested object structure
   * where selected path creates nesting and value is placed at the end.
   *
   * @example
   * unparseAttributeValues([
   *   { field: "target", value: "chest", selected: "muscle" },
   *   { field: "equipment", value: "bench", selected: "weight-training" }
   * ])
   *
   * => {
   *   target: { muscle: "chest" },
   *   equipment: { "weight-training": "bench" }
   * }
   */
  static attributeValuesToNestedObject(
    attributeValues: ExerciseAttributeValue[]
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const attr of attributeValues) {
      if (attr.selected === attr.value) {
        result[attr.field] = attr.value;
        continue;
      }

      if (!result[attr.field]) result[attr.field] = {};
      const pathParts = attr.selected.split(':');
      let currentLevel = result[attr.field] as Record<string, unknown>;

      // Build the nested structure
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (i === pathParts.length - 1) {
          // Last part - assign the value
          currentLevel[part] = attr.value;
        } else {
          // Create nested level if it doesn't exist
          currentLevel[part] = currentLevel[part] || {};
          currentLevel = currentLevel[part] as Record<string, unknown>;
        }
      }
    }

    return result;
  }
}
