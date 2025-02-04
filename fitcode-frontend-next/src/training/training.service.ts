import { Component } from '@/component/entity/component.entity';
import { Exercise } from '@/exercise/entity/exercise.entity';
import { Training } from '@/training/entity/training.entity';

export class TrainingService {
  static map(
    item: Training,
    options?: { components?: Component[]; exercises?: Exercise[] }
  ): Training {
    // populate components
    if (options?.components)
      item.components = item.components.map((component) => {
        const componentItem = options.components!.find(
          (c) => c.id === component.id
        );

        if (!componentItem) return component;
        return {
          ...component,
          component: componentItem,
        };
      });

    // populate exercises
    if (options?.exercises)
      item.components = item.components?.map((component) => ({
        ...component,
        supersets: component?.supersets?.map((superset) => ({
          ...superset,
          exercises: superset?.exercises?.map((exercise) => {
            return {
              ...exercise,
              exercise:
                options.exercises!.find((e) => e.id === exercise.id) || null,
            };
          }),
        })),
      }));

    // sort exercises by order
    item.components = item?.components?.map((component) => ({
      ...component,
      supersets: component?.supersets?.map((superset) => ({
        ...superset,
        exercises: superset?.exercises?.sort((a, b) => a.order - b.order),
      })),
    }));

    return item;
  }
}
