import { ComponentParam } from '@src/component/entity/component-param.entity';
import type { Workload, WorkloadMeta } from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { v4 } from 'uuid';
import {
  CompletedWorkload,
  PrescribedWorkload,
} from '../entity/workload-value.entity';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateRandomParamFieldValue } from './param-values.stub';
import { ParamToSelectedMap } from '../interface/param-to-selected.interface';
import { PARAMS } from '@src/component/constant/param.constant';

export function generateWorkloadStub(
  data?: Partial<Workload>,
  componentParams: ComponentParam[] = [],
  random = false,
): Workload {
  const meta = generateWorkloadMetaStub(data);
  const prescribed = generatePrescribedWorkloadStub(componentParams, random);
  const completed = generateCompletedWorkloadStub(componentParams, random);

  return {
    ...meta,
    ...prescribed,
    ...completed,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateWorkloadMetaStub(
  data?: Partial<WorkloadMeta>,
): WorkloadMeta {
  return {
    id: data?.id || v4(),
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    userId: data?.userId,
    trainingId: data?.trainingId,
    componentId: data?.componentId,
    exerciseId: data?.exerciseId,
    setNumber: data?.setNumber,
    supersetIndex: data?.supersetIndex,
    plannedAt: data?.plannedAt || new Date(),
    status: data?.status || SetStatus.NOT_STARTED,
    notes: data?.notes || null,
  };
}

/**
 * Generates prescribed workload values. You can pass an array of ComponentParams
 * to generate params you need. If you pass an empty array, all values will be set
 * to null. If random is true, it will generate random values for params, else it
 * will use default values or first options.
 */
export function generatePrescribedWorkloadStub(
  componentParams: ComponentParam[],
  random = false,
): PrescribedWorkload {
  const w: PrescribedWorkload = {};

  for (const param of componentParams) {
    const field = param.field as ParamType; // volWorkSets, int1, vol1, etc.
    const selected =
      parseDefaultValueOrFirstOption<ParamToSelectedMap[typeof field]>(param); // set, rep, kg, ...

    const value = random
      ? generateRandomParamFieldValue(selected)
      : parseOptionValueOrDefault(param, selected); // default value or first option, like "12" for reps

    switch (param.field) {
      case ParamType.VolWork1:
        w.volWork1Type = selected as VolType;
        w.prescribedVolWork1ValueL = value;
        w.prescribedVolWork1ValueR = value;
        break;
      case ParamType.VolWork2:
        w.volWork2Type = selected as VolType;
        w.prescribedVolWork2ValueL = value;
        w.prescribedVolWork2ValueR = value;
        break;
      case ParamType.VolRec1:
        w.volRecType = selected as VolType;
        w.prescribedVolRecValueL = value;
        w.prescribedVolRecValueR = value;
        break;
      case ParamType.IntWork1:
        w.intWork1Type = selected as IntType;
        w.prescribedIntWork1ValueL = value;
        w.prescribedIntWork1ValueR = value;
        break;
      case ParamType.IntWork2:
        w.intWork2Type = selected as IntType;
        w.prescribedIntWork2ValueL = value;
        w.prescribedIntWork2ValueR = value;
        break;
      case ParamType.IntRec1:
        w.intRecType = selected as IntType;
        w.prescribedIntRecValueL = value;
        w.prescribedIntRecValueR = value;
        break;
    }
  }

  return w;
}

export function generateCompletedWorkloadStub(
  componentParams: ComponentParam[] = PARAMS,
  random = false,
): CompletedWorkload {
  const w: CompletedWorkload = {};

  for (const param of componentParams) {
    const field = param.field as ParamType; // volWorkSets, int1, vol1, etc.
    const selected =
      parseDefaultValueOrFirstOption<ParamToSelectedMap[typeof field]>(param); // set, rep, kg, ...

    const value = random
      ? generateRandomParamFieldValue(selected)
      : parseOptionValueOrDefault(param, selected); // default value or first option, like "12" for reps

    switch (param.field) {
      case ParamType.VolWork1:
        w.volWork1ValueL = value;
        w.volWork1ValueR = value;
        break;
      case ParamType.VolWork2:
        w.volWork2ValueL = value;
        w.volWork2ValueR = value;
        break;
      case ParamType.VolRec1:
        w.volRecValueL = value;
        w.volRecValueR = value;
        break;
      case ParamType.IntWork1:
        w.intWork1ValueL = value;
        w.intWork1ValueR = value;
        break;
      case ParamType.IntWork2:
        w.intWork2ValueL = value;
        w.intWork2ValueR = value;
        break;
      case ParamType.IntRec1:
        w.intRecValueL = value;
        w.intRecValueR = value;
        break;
    }

    return w;
  }
}

export function parseDefaultValueOrFirstOption<T = string>(
  rootParam: ComponentParam,
): T {
  return (rootParam.defaultValue || rootParam.options?.[0]?.field || null) as T;
}

export function parseOptionValueOrDefault(
  rootParam: ComponentParam,
  selectedField: string,
): number {
  return +(
    rootParam.options?.find((o) => o.field === selectedField)?.defaultValue || 0
  );
}
