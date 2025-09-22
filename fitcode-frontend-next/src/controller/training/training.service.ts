import type { Attribute } from '../attribute/type/attribute.type';
import type { AttributeValue } from '../attribute/type/attribute-value.type';
import type { AuthUser } from '../auth/type/user.type';
import { IntType } from '../component/enum/param.enum';
import { VolType } from '../component/enum/param.enum';
import { ParamType } from '../component/enum/param.enum';
import type { Component } from '../component/type/component.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { Group } from '../group/type/group.type';
import type { Institution } from '../institution/type/institution.type';
import type { Method } from '../method/type/method.type';
import type { CompleteSet } from './type/complete-set.type';
import type { ExerciseSet } from './type/exercise-set.type';
import type { Superset } from './type/superset.type';
import type { Training } from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingExercise } from './type/training-exercise.type';
import type { TrainingReport } from './type/training-report.type';
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

    return item;
  }

  static mapMembers(item: Training, users: AuthUser[]): Training {
    item.members = item.membersIds.map(
      (id) => users.find((u) => u.uid === id)!
    );

    return item;
  }

  static mapReport<T extends TrainingReport>(
    item: T,
    data: {
      institutions?: Institution[];
      groups?: Group[];
      components?: Component[];
    }
  ): T {
    if (data.institutions)
      item.institution = data.institutions.find(
        (inst) => inst.id === item.institutionId
      );

    if (data.groups) {
      item.group = data.groups.find((g) => g.id === item.groupId);
      item.cycle = item.group?.cycles.find((c) => c.id === item.cycleId);
    }

    if (data.components) {
      item.mappedPlannedComponents = item.plannedComponents.map(
        (cId) => data.components!.find((c) => c.id === cId)!
      );
    }

    return item;
  }

  static exerciseSetToCompleteSet(
    set: ExerciseSet
  ): Omit<CompleteSet, 'userId'> {
    const fields = {
      repsL: set.paramValuesL.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Rep
      ),
      repsR: set.paramValuesR?.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Rep
      ),
      timeL: set.paramValuesL.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Time
      ),
      timeR: set.paramValuesR?.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Time
      ),
      distL: set.paramValuesL.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Dist
      ),
      distR: set.paramValuesR?.find(
        (p) => p.field === ParamType.VolWork1 && p.selected === VolType.Dist
      ),
      loadL: set.paramValuesL.find(
        (p) =>
          p.field === ParamType.IntWork1 &&
          [IntType.Kg, IntType.Bw, IntType.Rm].includes(p.selected as IntType)
      ),
      loadR: set.paramValuesR?.find(
        (p) =>
          p.field === ParamType.IntWork1 &&
          [IntType.Kg, IntType.Bw, IntType.Rm].includes(p.selected as IntType)
      ),
      tempoL: set.paramValuesL.find(
        (p) => p.field === ParamType.IntWork2 && p.selected === IntType.Tempo
      ),
      tempoR: set.paramValuesR?.find(
        (p) => p.field === ParamType.IntWork2 && p.selected === IntType.Tempo
      ),
      recTime: set.paramValuesL.find(
        (p) => p.field === ParamType.VolRec1 && p.selected === VolType.Time
      ),
      recDist: set.paramValuesL.find(
        (p) => p.field === ParamType.VolRec1 && p.selected === VolType.Dist
      ),
    };

    return {
      reps: fields.repsL?.value ? +fields.repsL.value : undefined,
      repsR: fields.repsR?.value ? +fields.repsR.value : undefined,
      time: fields.timeL?.value ? +fields.timeL.value : undefined,
      timeR: fields.timeR?.value ? +fields.timeR.value : undefined,
      dist: fields.distL?.value ? +fields.distL.value : undefined,
      distR: fields.distR?.value ? +fields.distR.value : undefined,
      load: fields.loadL?.value ? +fields.loadL.value : undefined,
      loadR: fields.loadR?.value ? +fields.loadR.value : undefined,
      tempo: fields.tempoL?.value ? +fields.tempoL.value : undefined,
      tempoR: fields.tempoR?.value ? +fields.tempoR.value : undefined,
      recTime: fields.recTime?.value ? +fields.recTime.value : undefined,
      recDist: fields.recDist?.value ? +fields.recDist.value : undefined,
      from: new Date(),
      to: new Date(),
    } as Omit<CompleteSet, 'userId'>;
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
}
