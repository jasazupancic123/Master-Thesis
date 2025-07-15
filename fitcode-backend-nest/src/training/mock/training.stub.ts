import { Paramtype } from '@nestjs/common';
import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';
import {
  generateRandomColor,
  generateRandomName,
} from '../../../test/common/utils/random.util';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { getTime } from '../../common/service/util/date.util';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../../component/enum/param.enum';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { Superset } from '../entity/superset.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
import { ValidParams } from '../interface/param-to-selected.interface';

export function generateTrainingStub(data?: Partial<Training>): Training {
  return {
    id: data?.id || v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    completedMembersIds: data?.completedMembersIds || [],
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    ownerId: data?.ownerId || global.trainer.uid,
    membersIds: data?.membersIds || [global.athlete.uid],
    stats: data?.stats || [],
    futureStats: data?.futureStats || [],
    copiedFromId: data?.copiedFromId || null,
    from: data?.from || addDays(new Date(), 1),
    to: data?.to || addHours(addDays(new Date(), 1), 2),
    warmup:
      data?.warmup || generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
    cooldown:
      data?.cooldown ||
      generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
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
    from: data?.from || getTime(addDays(new Date(), 2), 8, 0),
    to: data?.to || getTime(addDays(new Date(), 2), 8, 30),
    target: data?.target || null,
    periodizationType: data?.periodizationType || null,
    methodId: data?.methodId || null,
    completedMembersIds: data?.completedMembersIds || [],
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
    periodizationType: data?.periodizationType || null,
    membersIds: data?.membersIds || [],
    supersets: data?.supersets || [],
    futureStats: data?.futureStats || [],
  };
}

export function generateTrainingExercise(
  data?: Partial<TrainingExercise>,
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    params: data?.params || [],
    sets: data?.sets || [],
    attributes: data?.attributes || [],
    periodized: data?.periodized || false,
  };
}

/**
 * @param setNumber - The number of the set.
 * @param params - An array of tuples where each tuple contains
 * a parameter type and its value. Each tuple should be of the
 * form [VolWorkSetType | VolType | IntType, number].
 */
export function generateExerciseSet<T extends ValidParams>(
  setNumber: number,
  params: T[],
): ExerciseSet {
  const paramValues = params.map((param) => {
    const { field, selected, value } = param;

    switch (selected) {
      case VolWorkSetType.Set:
        return generateSetsStub(value);
      case VolType.Rep:
        return generateRepsStub(value, field);
      case VolType.Time:
        return generateTimeStub(value, field);
      case VolType.Dist:
        return generateDistanceStub(value, field);
      case IntType.Kg:
        return generateKgStub(value, field);
      case IntType.Bw:
        return generateBwStub(value, field);
      case IntType.Rm:
        return generateRmStub(value, field);
      case IntType.Tempo:
        return generateTempoStub(value, field);
      case IntType.Eff:
        return generateEffStub(value, field);
      case IntType.Mas:
        return generateMasStub(value, field);
      case IntType.Hrmax:
        return generateHrmaxStub(value, field);
      default:
        throw new Error(`Unknown selected type: ${selected}`);
    }
  });

  return {
    setNumber,
    paramValuesL: paramValues,
    paramValuesR: paramValues,
  };
}

export function generateSetsStub(sets: number): AttributeValue {
  return {
    field: ParamType.VolWorkSets,
    selected: VolWorkSetType.Set,
    value: sets.toString(),
  };
}

export function generateRepsStub(
  reps: number,
  field: ParamType.VolWork1 | ParamType.VolWork2 | ParamType.VolRec1,
): AttributeValue {
  return {
    field,
    selected: VolType.Rep,
    value: reps.toString(),
  };
}

export function generateTimeStub(
  time: number,
  field: ParamType.VolWork1 | ParamType.VolWork2 | ParamType.VolRec1,
): AttributeValue {
  return {
    field,
    selected: VolType.Time,
    value: time.toString(),
  };
}

export function generateDistanceStub(
  distance: number,
  field: ParamType.VolWork1 | ParamType.VolWork2 | ParamType.VolRec1,
): AttributeValue {
  return {
    field,
    selected: VolType.Dist,
    value: distance.toString(),
  };
}
export function generateKgStub(
  kg: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: IntType.Kg,
    value: kg.toString(),
  };
}

export function generateBwStub(
  bw: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: IntType.Bw,
    value: bw.toString(),
  };
}

export function generateRmStub(
  rm: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: IntType.Rm,
    value: rm.toString(),
  };
}

export function generateTempoStub(
  tempo: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: `${IntType.Tempo}:${tempo.toString()}`,
    value: tempo.toString(),
  };
}

export function generateEffStub(
  eff: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: `${IntType.Eff}:${eff.toString()}`,
    value: eff.toString(),
  };
}

export function generateMasStub(
  mas: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: IntType.Mas.toString(),
    value: mas.toString(),
  };
}

export function generateHrmaxStub(
  hrmax: number,
  field: ParamType.IntWork1 | ParamType.IntWork2 | ParamType.IntRec1,
): AttributeValue {
  return {
    field,
    selected: IntType.Hrmax.toString(),
    value: hrmax.toString(),
  };
}
