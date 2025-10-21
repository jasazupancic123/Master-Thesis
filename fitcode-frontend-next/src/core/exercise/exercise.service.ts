import type { Component } from '../component/type/component.type';
import type { Exercise } from './type/exercise.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { lib } from '@/lib';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState } from '@/lib/common/type/state.type';

export class ExerciseService {
  /**
   * Frontend filter for exercises (this will be moved )
   */
  static filter(
    data: Exercise[],
    filter: Partial<Exercise>,
    components: Component[]
  ): Exercise[] {
    const { componentIds, ...rest } = filter;
    let filtered = data;

    // filter by components
    if (
      componentIds?.length &&
      !componentIds.some((id) => id === WARMUP_ID || id === COOLDOWN_ID)
    ) {
      const allComponentsIds: string[] = [];

      for (const componentId of componentIds) {
        const component = components.find((c) => c.id === componentId);
        if (!component) continue;

        // filter by root node & filter by all its children
        allComponentsIds.push(component.id);
        const tree = lib.common.tree.fromArray(components, {
          rootId: component.id,
          idPropertyName: 'id',
          parentIdPropertyName: 'parentId',
          childrenPropertyName: 'children',
        });

        lib.common.tree.forEach(tree, 'children', (item) => {
          allComponentsIds.push(item.id);
          return null;
        });
      }

      if (allComponentsIds.length)
        filtered = filtered.filter((exercise) =>
          allComponentsIds.some((id) => exercise.componentIds.includes(id))
        );
    }

    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) return;

      filtered = filtered.filter((exercise) => {
        const exValue = exercise[key as keyof Exercise];

        if (typeof value === 'boolean') return exValue === value;
        if (Array.isArray(value)) {
          // filter by int range
          if (typeof value[0] === 'number' && typeof value[1] === 'number') {
            const [min, max] = value as unknown as [number, number];
            return (
              typeof exValue === 'number' && exValue >= min && exValue <= max
            );
          }

          // filter by array contains
          if (Array.isArray(exValue)) {
            value = (value as string[]).map((id) => {
              // remove only the first part before colon if it is the same as key
              const parts = id.split(':').map((p) => p.trim());
              return parts.length > 1 && parts[0] === key
                ? parts.slice(1).join(':')
                : id;
            });

            return value.some(
              (v) =>
                exValue.includes(v as never) ||
                (key === 'equipment' &&
                  exValue.some((ev) => ev.toString().includes(v)))
            );
          }
        }

        // string match
        return (
          typeof exValue === 'string' &&
          exValue.toLowerCase().includes(String(value).toLowerCase())
        );
      });
    });

    return filtered;
  }

  static paginate(
    filter: Partial<Exercise>,
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

    let filtered = ExerciseService.filter(exercises, filter, components);
    const total = filtered.length;

    // paginate
    const pages = Math.ceil(total / pagination.pageSize);
    const page = pages < pagination.pages ? 1 : pagination.page;

    filtered = lib.common.generic.paginate(filtered, {
      page,
      pageSize: pagination.pageSize,
      orderBy: { field: 'name', value: 'asc' },
    });

    // populate exercises
    filtered.map((exercise) => {
      ExerciseService.mapComponents(exercise, components);
    });

    setFilteredExercises(filtered);
    setPagination((prev) => ({
      ...prev,
      total,
      pages: Math.ceil(total / pagination.pageSize),
    }));
  }

  static mapComponents(item: Exercise, components: Component[]): Exercise {
    item.components = components.filter(({ id }) =>
      item.componentIds.includes(id)
    );

    item.rootComponents = components.map((component) =>
      lib.common.tree.getRoot(component, components)
    );

    return item;
  }
}
