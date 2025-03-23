import { v4 } from 'uuid';
import { Training } from '../entity/training.entity';
import { addDays, addHours, startOfDay } from 'date-fns';
import { TrainingComponent } from '../entity/training-component.entity';
import {
  generateRandomColor,
  generateRandomName,
} from '../../../test/utils/random.util';
import { Superset } from '../entity/superset.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { PARAMS } from '../../component/constant/param.constant';
import { Subgroup } from '../entity/subgroup.entity';

export function generateTrainingStub(data?: Partial<Training>): Training {
  return {
    id: v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    ownerId: data?.ownerId || global.trainer.uid,
    membersIds: data?.membersIds || [global.athlete.uid],
    copiedFromId: null,
    from: data?.from || addDays(new Date(), 1),
    to: data?.to || addHours(addDays(new Date(), 1), 2),
    components: data?.components || [],
    wellness: data?.wellness || [],
  };
}

export function generateTrainingComponent(
  data?: Partial<TrainingComponent>,
): TrainingComponent {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    from: data?.from || startOfDay(new Date()),
    to: data?.to || addHours(startOfDay(new Date()), 0.5),
    supersets: data?.supersets || [],
    subgroups: data?.subgroups || [],
  };
}

export function generateSuperset(data?: Partial<Superset>): Superset {
  return {
    color: data?.color || generateRandomColor(),
    exercises: data?.exercises || [],
  };
}

export function generateSubgroup(data?: Partial<Subgroup>): Subgroup {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    name: data?.name || generateRandomName(),
    membersIds: data?.membersIds || [],
    supersets: data?.supersets || [],
  };
}

export function generateTrainingExercise(
  data?: Partial<TrainingExercise>,
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    params: data?.params || PARAMS,
  };
}
