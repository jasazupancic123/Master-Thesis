import { Injectable } from '@nestjs/common';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CommonService } from '@src/common/service/common.service';
import { ValidateError } from '@src/common/type/validate.type';
import { Component } from '@src/component/entity/component.entity';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { Method } from '@src/method/entity/method.entity';
import { MAX_NUM_SETS_IN_EXERCISE } from '@src/training/constant/training-limits.constant';
import {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';

import { ExerciseParamAttribute } from '../constant/exercise-param.constant';

@Injectable()
export class ExerciseParamService {
  constructor(
    private readonly common: CommonService,
    private readonly attributeService: AttributeService,
  ) {}

  getPair(field: ExerciseParamField): ExerciseParamField | null {
    const pair = this.pairs.find((p) => p.includes(field));
    return pair ? (pair[0] === field ? pair[1] : pair[0]) : null;
  }

  readonly pairs: [ExerciseParamField, ExerciseParamField][] = [
    ['reps', 'repsR'],
    ['loadKg', 'loadKgR'],
    ['loadRm', 'loadRmR'],
    ['loadBw', 'loadBwR'],
    ['tempo', 'tempoR'],
    ['vel', 'velR'],
    ['eff', 'eff'],
    ['time', 'time'],
    ['dist', 'dist'],
    ['recTime', 'recTime'],
    ['recDist', 'recDist'],
  ];

  getAttributes(exercise: Exercise): Attribute<ExerciseSet>[] {
    const attributes: Attribute<ExerciseSet>[] = [];
    for (const param of exercise.params) {
      const attr = ExerciseParamAttribute[param];
      if (attr) attributes.push(attr);
    }

    return attributes;
  }

  /**
   * Converts set properties to array of attribute values for compatibility
   * with attribute service validation. If set is not provided, default values
   * are used.
   */
  getAttributeValues(
    exercise: Exercise,
    set?: ExerciseSet,
  ): AttributeValue<ExerciseSet>[] {
    const values: AttributeValue<ExerciseSet>[] = [];
    for (const field of exercise.params) {
      if (set)
        if (!this.common.object.isEmpty(set[field]))
          values.push({ field, value: set[field] }); // provided set
        else
          // default value
          values.push({
            field,
            value: ExerciseParamAttribute[field]
              ?.defaultValue as ExerciseSet[ExerciseParamField],
          });
    }

    return values;
  }

  getComponentParams(
    component: Component,
    isUnilateral: boolean,
  ): ExerciseParamField[] {
    const params: ExerciseParamField[] = [];
    for (const param of component?.params || [])
      if (isUnilateral) {
        // unilateral exercise, add both main and secondary side params
        const pair = this.pairs.find((p) => p.includes(param));
        if (pair && pair.length === 2) params.push(pair[0], pair[1]);
        else params.push(param);
      } else params.push(param); // bilateral exercise

    return Array.from(new Set(params));
  }

  attributeValuesToSet(
    values: AttributeValue<ExerciseSet>[],
    setNumber: number,
  ): ExerciseSet {
    const set: ExerciseSet = { setNumber };
    for (const val of values)
      set[val.field as any] = val.value as ExerciseSet[ExerciseParamField];

    return set;
  }

  modifyLoad(
    set: ExerciseSet,
    loadType: ExerciseParamField,
    value: (current: number) => number,
  ) {
    let prevValue: number | undefined;
    let prevValueR: number | undefined;

    switch (loadType) {
      case 'loadKg':
        prevValue = set.loadKg as number;
        prevValueR = set.loadKgR as number;
        break;
      case 'loadRm':
        prevValue = set.loadRm as number;
        prevValueR = set.loadRmR as number;
        break;
      case 'loadBw':
        prevValue = set.loadBw as number;
        prevValueR = set.loadBwR as number;
        break;
    }

    set.loadKg = value(prevValue);
    if (prevValueR) set.loadKgR = value(prevValueR);
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
      this.getAttributeValues(exercise, set),
      this.getAttributes(exercise),
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

  getLoadField(set: ExerciseSet): ExerciseParamField | null {
    if (!this.common.object.isEmpty(set.loadKg)) return 'loadKg';
    if (!this.common.object.isEmpty(set.loadRm)) return 'loadRm';
    if (!this.common.object.isEmpty(set.loadBw)) return 'loadBw';
    return null;
  }

  getVolField(set: ExerciseSet): ExerciseParamField | null {
    if (!this.common.object.isEmpty(set.reps)) return 'reps';
    if (!this.common.object.isEmpty(set.time)) return 'time';
    if (!this.common.object.isEmpty(set.dist)) return 'dist';
    return null;
  }

  private validateUnilaterality(
    set: ExerciseSet,
    isUnilateral: boolean,
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];
    if (!isUnilateral) return errors;

    for (const pair of this.pairs) {
      const isMainDefined = !this.common.object.isEmpty(set[pair[0]]);
      const isSecondaryDefined = !this.common.object.isEmpty(set[pair[1]]);

      if (
        (!isMainDefined && isSecondaryDefined) ||
        (isMainDefined && !isSecondaryDefined)
      ) {
        const primary = ExerciseParamAttribute[pair[0]];
        errors.push({
          field: primary.field,
          message: `Both primary and secondary side must be defined for param ${primary.name.toLowerCase()} in unilateral exercises`,
        });
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
      const pairs = this.pairs.find((p) =>
        p.includes(attr.field as ExerciseParamField),
      );

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
