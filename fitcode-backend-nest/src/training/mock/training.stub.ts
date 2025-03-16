import { v4 } from 'uuid';
import { Training } from '../entity/training.entity';
import { addHours, startOfDay } from 'date-fns';
import { TrainingComponent } from '../entity/training-component.entity';
import { generateRandomColor } from '../../../test/utils/random.util';
import { Superset } from '../entity/superset.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { PARAMS } from '../../component/constant/param.constant';

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
    from: data?.from || startOfDay(new Date()),
    to: data?.to || addHours(startOfDay(new Date()), 2),
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

export function generateTrainingExercise(
  data?: Partial<TrainingExercise>,
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    params: data?.params || PARAMS,
  };
}
