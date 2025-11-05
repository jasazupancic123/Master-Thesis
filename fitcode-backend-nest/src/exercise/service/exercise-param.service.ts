import { Injectable, NotFoundException } from '@nestjs/common';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CommonService } from '@src/common/service/common.service';
import { ValidateError } from '@src/common/type/validate.type';
import { Component } from '@src/exercise/entity/component.entity';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { MAX_NUM_SETS_IN_EXERCISE } from '@src/training/constant/training-limits.constant';
import {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';
import { TrainingExercise } from '@src/training/entity/training-exercise.entity';

import { ExerciseParamAttribute } from '../constant/exercise-param.constant';
import { Methods } from '../constant/method.constant';

@Injectable()
export class ExerciseParamService {
  constructor(
    private readonly common: CommonService,
    private readonly attributeService: AttributeService,
  ) {}

  readonly FIELDS: ExerciseParamField[] = [
    'reps',
    'repsR',
    'loadKg',
    'loadKgR',
    'loadRm',
    'loadRmR',
    'loadBw',
    'loadBwR',
    'tempoEcc',
    'tempoIso',
    'tempoCon',
    'tempoIdle',
    'tempoEccR',
    'tempoIsoR',
    'tempoConR',
    'tempoIdleR',
    'vel',
    'velR',
    'eff',
    'time',
    'dist',
    'recTime',
    'recDist',
  ];

  readonly PAIRS: Record<ExerciseParamField, ExerciseParamField> = {
    reps: 'repsR',
    repsR: 'reps',
    loadKg: 'loadKgR',
    loadKgR: 'loadKg',
    loadRm: 'loadRmR',
    loadRmR: 'loadRm',
    loadBw: 'loadBwR',
    loadBwR: 'loadBw',
    tempoEcc: 'tempoEccR',
    tempoIso: 'tempoIsoR',
    tempoCon: 'tempoConR',
    tempoIdle: 'tempoIdleR',
    tempoEccR: 'tempoEcc',
    tempoIsoR: 'tempoIso',
    tempoConR: 'tempoCon',
    tempoIdleR: 'tempoIdle',
    vel: 'velR',
    velR: 'vel',
    eff: 'effR',
    effR: 'eff',
    time: 'timeR',
    timeR: 'time',
    dist: 'distR',
    distR: 'dist',
    recTime: 'recTimeR',
    recTimeR: 'recTime',
    recDist: 'recDistR',
    recDistR: 'recDist',
  };

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
    for (const param of component?.params || []) {
      params.push(param);
      if (isUnilateral) params.push(this.PAIRS[param]);
    }

    return Array.from(new Set(params));
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

  validateExerciseValues(
    trainingExercise: TrainingExercise,
    exercise: Exercise,
    options?: {
      skipMethodValidation?: boolean;
      skipUnilateralityValidation?: boolean;
    },
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = options?.skipMethodValidation
      ? []
      : this.validateMethod(trainingExercise, exercise);

    for (const set of trainingExercise.sets)
      errors.push(...this.validateSetValues(set, exercise, options));

    return errors;
  }

  validateSetValues(
    set: ExerciseSet,
    exercise: Exercise,
    options?: { skipUnilateralityValidation?: boolean },
  ): ValidateError<ExerciseSet>[] {
    const errors: ValidateError<ExerciseSet>[] = [];
    if (set.setNumber < 1 || set.setNumber > MAX_NUM_SETS_IN_EXERCISE)
      errors.push({
        field: 'setNumber',
        message: `Set number must be between 1 and ${MAX_NUM_SETS_IN_EXERCISE}`,
      });

    if (!options?.skipUnilateralityValidation)
      errors.push(...this.validateUnilaterality(set, exercise.isUnilateral));

    this.attributeService.validate(
      this.getAttributeValues(exercise, set),
      this.getAttributes(exercise),
      (error) => errors.push(error),
    );

    return errors;
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

    for (const field of this.FIELDS) {
      const isMainDefined = !this.common.object.isEmpty(set[field]);
      const isSecondaryDefined = !this.common.object.isEmpty(
        set[this.PAIRS[field]],
      );

      if (
        (!isMainDefined && isSecondaryDefined) ||
        (isMainDefined && !isSecondaryDefined)
      ) {
        errors.push({
          field: ExerciseParamAttribute[field].field,
          message: `Both primary and secondary side must be defined for param ${ExerciseParamAttribute[field].name.toLowerCase()} in unilateral exercises`,
        });

        return errors;
      }
    }

    return errors;
  }

  private validateMethod(
    trainingExercise: TrainingExercise,
    exercise: Exercise,
  ): ValidateError<ExerciseSet>[] {
    if (!trainingExercise.methodId) return [];

    const method = Methods.find((m) => m.field === trainingExercise.methodId);
    if (!method) throw new NotFoundException('Method not found');

    const errors: ValidateError<ExerciseSet>[] = [];
    for (const attr of method.attributes) {
      if (attr.field === 'sets') {
        // special case for sets
        const sets = trainingExercise.sets.length;

        if (!this.common.object.isEmpty(attr.min))
          if (sets < attr.min)
            errors.push({
              field: 'sets' as ExerciseParamField,
              message: `Number of sets cannot be less than ${attr.min} for method ${method.name}`,
            });

        if (!this.common.object.isEmpty(attr.max))
          if (sets > attr.max)
            errors.push({
              field: 'sets' as ExerciseParamField,
              message: `Number of sets cannot be greater than ${attr.max} for method ${method.name}`,
            });
      } else {
        const param = ExerciseParamAttribute[attr.field];

        for (const set of trainingExercise.sets) {
          const primary = set[attr.field];
          const secondary = exercise.isUnilateral
            ? set[this.PAIRS[attr.field]]
            : undefined;

          for (const value of [primary, secondary]) {
            if (this.common.object.isEmpty(value)) continue;

            if (attr.disabled)
              errors.push({
                field: attr.field as ExerciseParamField,
                message: `Parameter ${param.name.toLowerCase()} is disabled for method ${method.name}`,
              });

            if (!this.common.object.isEmpty(attr.min))
              if (typeof value === 'number' && value < attr.min)
                errors.push({
                  field: attr.field as ExerciseParamField,
                  message: `Value for ${attr.field} cannot be less than ${attr.min}`,
                });

            if (!this.common.object.isEmpty(attr.max))
              if (typeof value === 'number' && value > attr.max)
                errors.push({
                  field: attr.field as ExerciseParamField,
                  message: `Value for ${attr.field} cannot be greater than ${attr.max}`,
                });

            if (!this.common.object.isEmpty(attr.pattern)) {
              const regex = new RegExp(attr.pattern);
              if (typeof value === 'string' && !regex.test(value))
                errors.push({
                  field: attr.field as ExerciseParamField,
                  message: `Value for ${attr.field} must match pattern ${attr.pattern}`,
                });
            }
          }
        }
      }
    }

    return errors;
  }
}
