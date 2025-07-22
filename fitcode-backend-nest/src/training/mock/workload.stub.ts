import { ComponentParam } from '@src/component/entity/component-param.entity';
import type { Workload, WorkloadMeta } from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { v4 } from 'uuid';
import {
  CompletedWorkload,
  PrescribedWorkload,
  WorkloadValue,
} from '../entity/workload-value.entity';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateRandomParamFieldValue } from './param-values.stub';
import { ParamToSelectedMap } from '../interface/param-to-selected.interface';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
} from '@src/component/constant/param.constant';
import { Component } from '@src/component/entity/component.entity';

export function generateWorkloadStub(
  component: Component,
  data?: Partial<Omit<Workload, 'componentId'>> & {
    defaultParamsKey?: string;
    randomValues?: boolean;
    customComponentParams?: ComponentParam[];
  },
): Workload {
  const random = data?.randomValues || false;
  const defaultParamsKey = data?.defaultParamsKey || DEFAULT_PARAMS_KEY;
  const componentParams =
    data?.customComponentParams || component.params?.[defaultParamsKey] || [];

  const meta = generateWorkloadMetaStub({ ...data, componentId: component.id });
  const prescribed = generatePrescribedWorkloadStub(componentParams, random);
  const completed = generateCompletedWorkloadStub(componentParams, random);

  const { id, ...rest } = data;

  return {
    ...meta,
    ...prescribed,
    ...completed,
    ...getPrescribedWorkloadFields(data), // override prescribed values if provided
    ...getCompletedWorkloadFields(data), // override completed values if provided
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
  const foundParam = PARAMS.find((p) => p.field === rootParam.field);
  const foundOption = foundParam?.options?.find(
    (o) => o.field === selectedField,
  );

  return +(foundOption?.defaultValue || 0);
}

function getPrescribedWorkloadFields(data: WorkloadValue): PrescribedWorkload {
  return {
    ...(data.volWork1Type && { volWork1Type: data.volWork1Type }),
    ...(data.prescribedVolWork1ValueL && {
      prescribedVolWork1ValueL: data.prescribedVolWork1ValueL,
    }),
    ...(data.prescribedVolWork1ValueR && {
      prescribedVolWork1ValueR: data.prescribedVolWork1ValueR,
    }),
    ...(data.volWork2Type && { volWork2Type: data.volWork2Type }),
    ...(data.prescribedVolWork2ValueL && {
      prescribedVolWork2ValueL: data.prescribedVolWork2ValueL,
    }),
    ...(data.prescribedVolWork2ValueR && {
      prescribedVolWork2ValueR: data.prescribedVolWork2ValueR,
    }),
    ...(data.volRecType && { volRecType: data.volRecType }),
    ...(data.prescribedVolRecValueL && {
      prescribedVolRecValueL: data.prescribedVolRecValueL,
    }),
    ...(data.prescribedVolRecValueR && {
      prescribedVolRecValueR: data.prescribedVolRecValueR,
    }),
    ...(data.intWork1Type && { intWork1Type: data.intWork1Type }),
    ...(data.prescribedIntWork1ValueL && {
      prescribedIntWork1ValueL: data.prescribedIntWork1ValueL,
    }),
    ...(data.prescribedIntWork1ValueR && {
      prescribedIntWork1ValueR: data.prescribedIntWork1ValueR,
    }),
    ...(data.intWork2Type && { intWork2Type: data.intWork2Type }),
    ...(data.prescribedIntWork2ValueL && {
      prescribedIntWork2ValueL: data.prescribedIntWork2ValueL,
    }),
    ...(data.prescribedIntWork2ValueR && {
      prescribedIntWork2ValueR: data.prescribedIntWork2ValueR,
    }),
    ...(data.intRecType && { intRecType: data.intRecType }),
    ...(data.prescribedIntRecValueL && {
      prescribedIntRecValueL: data.prescribedIntRecValueL,
    }),
    ...(data.prescribedIntRecValueR && {
      prescribedIntRecValueR: data.prescribedIntRecValueR,
    }),
  };
}

function getCompletedWorkloadFields(data: WorkloadValue): CompletedWorkload {
  return {
    ...(data.volWork1ValueL && { volWork1ValueL: data.volWork1ValueL }),
    ...(data.volWork1ValueR && { volWork1ValueR: data.volWork1ValueR }),
    ...(data.volWork2ValueL && { volWork2ValueL: data.volWork2ValueL }),
    ...(data.volWork2ValueR && { volWork2ValueR: data.volWork2ValueR }),
    ...(data.volRecValueL && { volRecValueL: data.volRecValueL }),
    ...(data.volRecValueR && { volRecValueR: data.volRecValueR }),
    ...(data.intWork1ValueL && { intWork1ValueL: data.intWork1ValueL }),
    ...(data.intWork1ValueR && { intWork1ValueR: data.intWork1ValueR }),
    ...(data.intWork2ValueL && { intWork2ValueL: data.intWork2ValueL }),
    ...(data.intWork2ValueR && { intWork2ValueR: data.intWork2ValueR }),
    ...(data.intRecValueL && { intRecValueL: data.intRecValueL }),
    ...(data.intRecValueR && { intRecValueR: data.intRecValueR }),
  };
}
