import { Injectable } from '@nestjs/common';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CommonService } from '@src/common/service/common.service';
import { ValidateError } from '@src/common/type/validate.type';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { Method } from '@src/method/entity/method.entity';

import { ExerciseParam } from '../constant/exercise-param.constant';
import {
  DEFAULT_NUM_SETS_IN_EXERCISE,
  MAX_NUM_SETS_IN_EXERCISE,
} from '../constant/training-limits.constant';
import {
  ExerciseSet,
  ExerciseSetPrimarySide,
  ExerciseSetSecondarySide,
} from '../entity/exercise-set.entity';
import { LoadType } from '../enum/load-type.enum';

@Injectable()
export class ExerciseParamService {
  constructor(
    private readonly common: CommonService,
    private readonly attributeService: AttributeService,
  ) {}

  getAttributeValues(set: ExerciseSet): AttributeValue<ExerciseSet>[] {
    const values: AttributeValue<ExerciseSet>[] = [];
    for (const field of ExerciseParam.fields)
      if (!this.common.object.isEmpty(set[field]))
        values.push({ field, value: set[field] });

    return values;
  }

  getDefaultSets(isUnilateral: boolean, fields: string[]): ExerciseSet[] {
    return Array.from({ length: DEFAULT_NUM_SETS_IN_EXERCISE }).map((_, i) => ({
      setNumber: i + 1,
      ...this.getSetParams(isUnilateral, fields),
    }));
  }

  getSetParams(
    isUnilateral: boolean,
    fields: string[] = ExerciseParam.fields,
  ): Omit<ExerciseSet, 'setNumber'> {
    const params = ExerciseParam.getAll(fields as (keyof ExerciseSet)[]);

    const reps = params.find((a) => a.field === ExerciseParam.REPS.field);
    const loadKg = params.find((a) => a.field === ExerciseParam.KG.field);
    const loadRm = params.find((a) => a.field === ExerciseParam.RM.field);
    const loadBw = params.find((a) => a.field === ExerciseParam.BW.field);
    const tempo = params.find((a) => a.field === ExerciseParam.TEMPO.field);
    const vel = params.find((a) => a.field === ExerciseParam.VEL.field);
    const eff = params.find((a) => a.field === ExerciseParam.EFF.field);
    const time = params.find((a) => a.field === ExerciseParam.TIME.field);
    const dist = params.find((a) => a.field === ExerciseParam.DIST.field);
    const rt = params.find((a) => a.field === ExerciseParam.REC_TIME.field);
    const rd = params.find((a) => a.field === ExerciseParam.REC_DIST.field);

    const primarySide: ExerciseSetPrimarySide = {
      reps: (reps || ExerciseParam.REPS).defaultValue as number,
      loadKg: loadKg?.defaultValue as number,
      loadRm: loadRm?.defaultValue as number,
      loadBw: loadBw?.defaultValue as number,
      tempo: tempo?.defaultValue as string,
      vel: vel?.defaultValue as number,
    };

    const secondarySide: ExerciseSetSecondarySide = isUnilateral
      ? {
          repsR: primarySide.reps,
          loadKgR: primarySide.loadKg,
          loadRmR: primarySide.loadRm,
          loadBwR: primarySide.loadBw,
          tempoR: primarySide.tempo,
          velR: primarySide.vel,
        }
      : {};

    return this.common.object.clean(
      {
        ...primarySide,
        ...secondarySide,
        loadType: this.getLoadType(primarySide),
        eff: eff?.defaultValue as number,
        recTime: rt?.defaultValue as number,
        time: time?.defaultValue as number,
        dist: dist?.defaultValue as number,
        recDist: rd?.defaultValue as number,
      },
      true,
    ) as ExerciseSet;
  }

  modifyParamValue<T extends keyof ExerciseSet>(
    set: ExerciseSet,
    param: T,
    value: (current: ExerciseSet[T]) => ExerciseSet[T],
  ) {
    if (!this.has(set, param)) return;

    const pair = ExerciseParam.pairs.find((p) => p.includes(param));
    if (!pair) return;

    for (const field of pair)
      if (!this.common.object.isEmpty(set[field]))
        set[field as T] = value(set[field as T]);
  }

  has(set: ExerciseSet, param: keyof ExerciseSet): boolean {
    return !this.common.object.isEmpty(set[param]);
  }

  validateSetValues(
    exercise: Exercise,
    set: ExerciseSet,
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];

    if (set.setNumber < 1 || set.setNumber > MAX_NUM_SETS_IN_EXERCISE)
      errors.push({
        field: 'setNumber',
        message: `Set number must be between 1 and ${MAX_NUM_SETS_IN_EXERCISE}`,
      });

    errors.push(...this.validateUnilaterality(set, exercise.isUnilateral));

    this.attributeService.validate(
      this.getAttributeValues(set),
      ExerciseParam.getAll(),
      (error) => errors.push(error),
    );

    return errors;
  }

  validateMethods(
    set: ExerciseSet,
    methods: Method[],
    methodId: string | undefined,
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];
    if (!methodId) return errors;

    const method = methods.find((m) => m.id === methodId);
    if (!method) {
      errors.push({
        field: 'loadKg',
        message: `Method not found for training component`,
      });

      return errors;
    }

    if (method.attributes?.length > 0)
      errors.push(...this.validateMethod(set, method));

    return errors;
  }

  tempoToSeconds(tempo: number | string | undefined): number {
    if (tempo === undefined || tempo === null) return 0;

    if (typeof tempo === 'number') {
      // e.g. 4210 → 4 + 2 + 1 + 0 = 7
      const digits = tempo.toString().split('').map(Number);
      return digits.reduce((sum, n) => sum + (isNaN(n) ? 0 : n), 0);
    }

    if (typeof tempo === 'string') {
      // e.g. "4.2:1.0:3.5:0.5" → sum = 9.2
      const parts = tempo.split(':').map((p) => parseFloat(p));
      return parts.reduce((sum, n) => sum + (isNaN(n) ? 0 : n), 0);
    }

    return 0;
  }

  // priority: kg > rm > bw
  getLoadType(set: ExerciseSetPrimarySide): LoadType | undefined {
    if (!this.common.object.isEmpty(set.loadKg)) return LoadType.Kg;
    if (!this.common.object.isEmpty(set.loadRm)) return LoadType.Rm;
    if (!this.common.object.isEmpty(set.loadBw)) return LoadType.Bw;
    return undefined;
  }

  private validateUnilaterality(
    set: ExerciseSet,
    isUnilateral: boolean,
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];
    if (!isUnilateral) return errors;

    for (const pair of ExerciseParam.pairs) {
      const isMainDefined = !this.common.object.isEmpty(set[pair[0]]);
      const isSecondaryDefined = !this.common.object.isEmpty(set[pair[1]]);

      console.log('validating pair:', pair, isMainDefined, isSecondaryDefined);

      if (pair.length === 1) continue; // only one param in the pair, doesn't matter if it's defined or not, so skip
      if (pair.length === 2) {
        if (
          (!isMainDefined && isSecondaryDefined) ||
          (isMainDefined && !isSecondaryDefined)
        ) {
          const primary = ExerciseParam.get(pair[0]);
          errors.push({
            field: primary.field,
            message: `Both primary and secondary side must be defined for param ${primary.name} in unilateral exercises`,
          });
        }
      }
    }

    return errors;
  }

  private validateMethod(
    set: ExerciseSet,
    method: Method,
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];

    for (const attr of method.attributes) {
      const pairs = ExerciseParam.pairs.find((p) => p.includes(attr.field));
      if (!pairs) continue;

      for (const field of pairs) {
        const setValue = set[field];
        if (this.common.object.isEmpty(setValue)) continue;

        if (!this.common.object.isEmpty(attr.min))
          if (typeof setValue === 'number' && setValue < attr.min)
            errors.push({
              field: attr.field,
              message: `Value for ${attr.field} cannot be less than ${attr.min}`,
            });

        if (!this.common.object.isEmpty(attr.max))
          if (typeof setValue === 'number' && setValue > attr.max)
            errors.push({
              field: attr.field,
              message: `Value for ${attr.field} cannot be greater than ${attr.max}`,
            });
      }
    }

    return errors;
  }
}
