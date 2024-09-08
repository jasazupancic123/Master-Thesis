import { Cycle } from '@/group/type/cycle.type';
import dayjs from 'dayjs';
import { Training } from '@/training/type/training.type';
import { Component } from '@/component/type/component.type';
import { Exercise } from '@/exercise/type/exercise.type';
import { ObjectUtil } from '@/common/service/util/object.util';

export class FirebaseFirestoreUtil {
  static populateCycle(item: Cycle): Cycle {
    item.startDate = dayjs(item.startDate);
    item.endDate = dayjs(item.endDate);
    return item;
  }

  static populateTraining(item: Training, components: Component[]): Training {
    // convert dates to dayjs
    item.startTime = dayjs(item.startTime);
    item.endTime = dayjs(item.endTime);

    // if set groups are defined, map components to set groups
    item.setGroups = (item.setGroups || []).map((setGroup) => {
      setGroup.component = components.find((c) => c.id === setGroup.componentId)!;
      return setGroup;
    });

    return item;
  }

  static populateExercise(item: Exercise): Exercise {
    item.attributeValues = ObjectUtil.flattenObject(item.attributeValues);
    return item;
  }
}