import { Cycle } from '@/group/entity/cycle.entity';
import { Training } from '@/training/entity/training.entity';
import { Component } from '@/component/entity/component.entity';
import { Exercise } from '@/exercise/entity/exercise.entity';
import { CommonService } from '@/common/service/common.service';

export class FirebaseFirestoreUtil {
  populateCycle(item: Cycle): Cycle {
    // item.from = dayjs(item.from);
    // item.to = dayjs(item.to);
    return item;
  }

  populateTraining(item: Training, components: Component[]): Training {
    // convert dates to dayjs
    // item.from = dayjs(item.from);
    // item.to = dayjs(item.to);

    // populate components
    item.components = item.components.map((component) => {
      const componentItem = components.find((c) => c.id === component.componentId);
      if (!componentItem)
        return component;

      return {
        ...component,
        component: componentItem,
      };
    });

    return item;
  }

  populateExercise(item: Exercise): Exercise {
    item.attributeValues = CommonService.instance.object.flattenObject(item.attributeValues);
    return item;
  }
}