import type { Attribute } from '../attribute/type/attribute.type';
import type { AttributeValue } from '../attribute/type/attribute-value.type';
import type { IntType, VolType } from '../component/enum/param.enum';
import { ParamType } from '../component/enum/param.enum';
import type { Component } from '../component/type/component.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { Method } from '../method/type/method.type';
import type { AuthUser } from '../auth/type/user.type';
import type { ExerciseSet } from './type/exercise-set.type';
import type { Superset } from './type/superset.type';
import type { Training } from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingExercise } from './type/training-exercise.type';
import type { PrescribedWorkload } from './type/workload-value.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';

type PWKey = keyof PrescribedWorkload;
type Triple = readonly [PWKey, PWKey, PWKey];

export class TrainingService {
  static mapData<T extends Training>(
    item: T,
    data: {
      components?: Component[];
      exercises?: Exercise[];
      methods?: Method[];
    }
  ) {
    if (data.methods)
      for (const tc of item.components)
        tc.method = data.methods.find((m) => m.id === tc.methodId);

    if (data.components) {
      for (const tc of item.components)
        tc.component = data.components.find((c) => c.id === tc.id);

      item.warmup.component = data.components.find(
        (c) => c.id === item.warmup.id
      );

      item.cooldown.component = data.components.find(
        (c) => c.id === item.cooldown.id
      );
    }

    if (data.exercises) {
      for (const tc of item.components) {
        for (const s of tc.supersets)
          for (const e of s.exercises) {
            e.exercise = data.exercises.find(({ id }) => id === e.id);
            if (!Array.isArray(e.params)) e.params = Object.values(e.params);
          }

        for (const subgroup of tc.subgroups)
          for (const s of subgroup.supersets)
            for (const e of s.exercises) {
              e.exercise = data.exercises.find(({ id }) => id === e.id);
              if (!Array.isArray(e.params)) e.params = Object.values(e.params);
            }
      }

      for (const s of item.warmup.supersets)
        for (const e of s.exercises) {
          e.exercise = data.exercises.find(({ id }) => id === e.id);
          if (!Array.isArray(e.params)) e.params = Object.values(e.params);
        }

      for (const s of item.cooldown.supersets)
        for (const e of s.exercises) {
          e.exercise = data.exercises.find(({ id }) => id === e.id);
          if (!Array.isArray(e.params)) e.params = Object.values(e.params);
        }
    }
  }

  static mapMembers(item: Training, users: AuthUser[]): Training {
    item.members = item.membersIds.map(
      (id) => users.find((u) => u.uid === id)!
    );

    return item;
  }

  static excludeWarmupCooldown(components: Component[]): Component[] {
    return components.filter((c) => c.id !== WARMUP_ID && c.id !== COOLDOWN_ID);
  }

  static getPrescribedSupersetsByUser(
    userId: string,
    component: TrainingComponent
  ): Superset[] {
    // check if user is in subgroups first
    for (const subgroup of component.subgroups)
      if (subgroup.membersIds.includes(userId)) return subgroup.supersets;

    return component.supersets; // default group
  }

  private static getFieldNames(field: string): Triple | undefined {
    switch (field) {
      case ParamType.VolWork1:
        return [
          'volWork1Type',
          'prescribedVolWork1ValueL',
          'prescribedVolWork1ValueR',
        ];
      case ParamType.VolWork2:
        return [
          'volWork2Type',
          'prescribedVolWork2ValueL',
          'prescribedVolWork2ValueR',
        ];
      case ParamType.VolRec1:
        return [
          'volRecType',
          'prescribedVolRecValueL',
          'prescribedVolRecValueR',
        ];
      case ParamType.IntWork1:
        return [
          'intWork1Type',
          'prescribedIntWork1ValueL',
          'prescribedIntWork1ValueR',
        ];
      case ParamType.IntWork2:
        return [
          'intWork2Type',
          'prescribedIntWork2ValueL',
          'prescribedIntWork2ValueR',
        ];
      case ParamType.IntRec1:
        return [
          'intRecType',
          'prescribedIntRecValueL',
          'prescribedIntRecValueR',
        ];
      default:
        return undefined;
    }
  }

  static getPrescribedWorkload(
    exerciseToUpdate: TrainingExercise,
    prescribedSet: ExerciseSet,
    baseIsUnilatCurrentIsBilat = false
  ): PrescribedWorkload {
    /*
      if base is unilat, it only updates L values and if the current exercise is billat,
      then update L and R to the unilat's L
    */
    const paramValuesLToUpdate = exerciseToUpdate.sets[0].paramValuesL;
    const paramValuesRToUpdate = exerciseToUpdate.sets[0].paramValuesR;

    const prescribedValuesL = prescribedSet.paramValuesL;
    const prescribedValuesR = prescribedSet.paramValuesR;

    // paramValuesLToUpdate -> ['ref', 'eff', 'time']
    // prescribedValuesL -> ['ref', 'kg', 'eff', 'time']

    let workload: PrescribedWorkload = {};

    // update L values and if baseIsUnilatCurrentIsBilat is true, then also R values
    for (const updateParamValueL of paramValuesLToUpdate) {
      const prescribedParamValueL = prescribedValuesL.find(
        (p) => p.selected === updateParamValueL.selected
      );
      if (!prescribedParamValueL) continue;

      const field = updateParamValueL.field;

      const fieldNames = this.getFieldNames(field);
      if (!fieldNames) continue;

      const [typeField, valueLField, valueRField] = fieldNames; // all PWKey

      workload = {
        ...workload,
        [typeField]: typeField.includes('int')
          ? this.parseSelected<IntType>(prescribedParamValueL)
          : this.parseSelected<VolType>(prescribedParamValueL),
      };
      workload = {
        ...workload,
        [valueLField]: this.parseValue(prescribedParamValueL) as number,
      };
      workload = {
        ...workload,
        [valueRField]: baseIsUnilatCurrentIsBilat
          ? (this.parseValue(prescribedParamValueL) as number)
          : undefined,
      };
    }

    // already updated both L and R values, no need to update R values separately
    if (baseIsUnilatCurrentIsBilat) return workload;

    // update R values
    if (paramValuesRToUpdate && prescribedValuesR) {
      for (const updateParamValueR of paramValuesRToUpdate) {
        const prescribedParamValueR = prescribedValuesR.find(
          (p) => p.selected === updateParamValueR.selected
        );
        if (!prescribedParamValueR) continue;

        const field = updateParamValueR.field;

        const fieldNames = this.getFieldNames(field);
        if (!fieldNames) continue;

        const [typeField, valueLField, valueRField] = fieldNames; // all PWKey

        workload = {
          ...workload,
          [valueRField]: baseIsUnilatCurrentIsBilat
            ? (this.parseValue(prescribedParamValueR) as number)
            : undefined,
        };
      }
    }

    return workload;

    if (!exerciseToUpdate) {
      const { paramValuesL, paramValuesR } = prescribedSet;
      const volWork1L = paramValuesL.find(
        (p) => p.field === ParamType.VolWork1
      );
      const volWork1R = paramValuesR?.find(
        (p) => p.field === ParamType.VolWork1
      );
      const volWork2L = paramValuesL.find(
        (p) => p.field === ParamType.VolWork2
      );
      const volWork2R = paramValuesR?.find(
        (p) => p.field === ParamType.VolWork2
      );
      const volRecL = paramValuesL.find((p) => p.field === ParamType.VolRec1);
      const volRecR = paramValuesR?.find((p) => p.field === ParamType.VolRec1);
      const intWork1L = paramValuesL.find(
        (p) => p.field === ParamType.IntWork1
      );
      const intWork1R = paramValuesR?.find(
        (p) => p.field === ParamType.IntWork1
      );
      const intWork2L = paramValuesL.find(
        (p) => p.field === ParamType.IntWork2
      );
      const intWork2R = paramValuesR?.find(
        (p) => p.field === ParamType.IntWork2
      );
      const intRecL = paramValuesL.find((p) => p.field === ParamType.IntRec1);
      const intRecR = paramValuesR?.find((p) => p.field === ParamType.IntRec1);

      return {
        volWork1Type: this.parseSelected<VolType>(volWork1L),
        prescribedVolWork1ValueL: this.parseValue(volWork1L) as number,
        prescribedVolWork1ValueR: baseIsUnilatCurrentIsBilat
          ? (this.parseValue(volWork1L) as number)
          : volWork1R
            ? (this.parseValue(volWork1R) as number)
            : undefined,
        volWork2Type: this.parseSelected<VolType>(volWork2L),
        prescribedVolWork2ValueL: this.parseValue(volWork2L) as number,
        prescribedVolWork2ValueR: baseIsUnilatCurrentIsBilat
          ? (this.parseValue(volWork2L) as number)
          : volWork2R
            ? (this.parseValue(volWork2R) as number)
            : undefined,
        volRecType: this.parseSelected<VolType>(volRecL),
        prescribedVolRecValueL: this.parseValue(volRecL) as number,
        prescribedVolRecValueR: baseIsUnilatCurrentIsBilat
          ? (this.parseValue(volRecL) as number)
          : volRecR
            ? (this.parseValue(volRecR) as number)
            : undefined,
        intWork1Type: this.parseSelected<IntType>(intWork1L),
        prescribedIntWork1ValueL: this.parseValue(intWork1L),
        prescribedIntWork1ValueR: baseIsUnilatCurrentIsBilat
          ? this.parseValue(intWork1L)
          : intWork1R
            ? this.parseValue(intWork1R)
            : undefined,
        intWork2Type: this.parseSelected<IntType>(intWork2L),
        prescribedIntWork2ValueL: this.parseValue(intWork2L),
        prescribedIntWork2ValueR: baseIsUnilatCurrentIsBilat
          ? this.parseValue(intWork2L)
          : intWork2R
            ? this.parseValue(intWork2R)
            : undefined,
        intRecType: this.parseSelected<IntType>(intRecL),
        prescribedIntRecValueL: this.parseValue(intRecL),
        prescribedIntRecValueR: baseIsUnilatCurrentIsBilat
          ? this.parseValue(intRecL)
          : intRecR
            ? this.parseValue(intRecR)
            : undefined,
      };
    }
  }

  static getPerscribedFieldName(
    param: Attribute | AttributeValue,
    leftOrRight: 'L' | 'R'
  ): keyof PrescribedWorkload {
    let perscribedFieldName;
    switch (param.field) {
      case 'int1':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntWork1ValueL'
            : 'prescribedIntWork1ValueR';
        break;
      case 'int2':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntWork2ValueL'
            : 'prescribedIntWork2ValueR';
        break;
      case 'vol1':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolWork1ValueL'
            : 'prescribedVolWork1ValueR';
        break;
      case 'vol2':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolWork2ValueL'
            : 'prescribedVolWork2ValueR';
        break;
      case 'intRec':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntRecValueL'
            : 'prescribedIntRecValueR';
        break;
      case 'volRec':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolRecValueL'
            : 'prescribedVolRecValueR';
        break;
      default:
        throw new Error(
          `Unknown param field: ${param.field}. Cannot determine prescribed field name.`
        );
    }

    return perscribedFieldName as keyof PrescribedWorkload;
  }

  private static parseSelected<T = string>(
    attributeValue: AttributeValue | undefined
  ): T | undefined {
    if (!attributeValue?.selected) return undefined;
    return attributeValue.selected.split(':')[0] as T;
  }

  private static parseValue(
    attributeValue: AttributeValue | undefined
  ): number | undefined {
    if (!attributeValue?.value) return undefined;
    if (attributeValue?.value)
      if (!isNaN(+attributeValue.value)) return +attributeValue.value;

    return NaN;
  }

  private static calculateParamTypeAverages(
    sets: ExerciseSet[]
  ): Record<ParamType, number> {
    const sums: Record<ParamType, number> = {} as unknown as Record<
      ParamType,
      number
    >;

    const counts: Record<ParamType, number> = {} as unknown as Record<
      ParamType,
      number
    >;

    // initialize sums and counts for each ParamType
    Object.values(ParamType).forEach((param) => {
      sums[param] = 0;
      counts[param] = 0;
    });

    // iterate through sets and calculate sums and counts
    for (const set of sets) {
      for (const { field, value } of set.paramValuesL.concat(
        set.paramValuesR || []
      )) {
        if (sums.hasOwnProperty(field)) {
          sums[field as ParamType] += parseFloat(value);
          counts[field as ParamType] += 1;
        }
      }
    }

    // calculate averages
    const averages: Record<ParamType, number> = {} as unknown as Record<
      ParamType,
      number
    >;

    Object.keys(sums).forEach((field) => {
      averages[field as ParamType] = counts[field as ParamType]
        ? sums[field as ParamType] / counts[field as ParamType]
        : 0;
    });

    // round averages to 2 decimal places
    Object.keys(averages).forEach((field) => {
      averages[field as ParamType] = parseFloat(
        averages[field as ParamType].toFixed(2)
      );
    });

    return averages;
  }
}
