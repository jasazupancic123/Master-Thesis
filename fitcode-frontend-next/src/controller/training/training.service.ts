import type { Attribute } from '../attribute/type/attribute.type';
import type { AttributeValue } from '../attribute/type/attribute-value.type';
import type { IntType, VolType } from '../component/enum/param.enum';
import { ParamType } from '../component/enum/param.enum';
import type { Component } from '../component/type/component.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { Method } from '../method/type/method.type';
import type { User } from '../user/type/user.type';
import type { ExerciseSet } from './type/exercise-set.type';
import type { Subgroup } from './type/subgroup.type';
import type { SubgroupInfo } from './type/subgroup.type';
import type { Superset } from './type/superset.type';
import type { Training } from './type/training.type';
import type { TrainingInfo } from './type/training.type';
import type { TrainingComponentInfo } from './type/training-component.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingExerciseAverageStats } from './type/training-exercise-average-stats.type';
import type { PrescribedWorkload } from './type/workload-value.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';

function isTrainingComponent(
  item: TrainingComponent | TrainingComponentInfo
): item is TrainingComponent {
  return 'supersets' in item;
}

export class TrainingService {
  static mapData<T extends Training | TrainingInfo>(
    item: T,
    data: {
      prescribedStats?: boolean;
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
        if (!isTrainingComponent(tc)) continue;

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

      if (isTrainingComponent(item.warmup))
        for (const s of item.warmup.supersets)
          for (const e of s.exercises) {
            e.exercise = data.exercises.find(({ id }) => id === e.id);
            if (!Array.isArray(e.params)) e.params = Object.values(e.params);
          }

      if (isTrainingComponent(item.cooldown))
        for (const s of item.cooldown.supersets)
          for (const e of s.exercises) {
            e.exercise = data.exercises.find(({ id }) => id === e.id);
            if (!Array.isArray(e.params)) e.params = Object.values(e.params);
          }
    }

    if (data.prescribedStats)
      if (isTrainingComponent(item.components[0]))
        this.mapPrescribedStats(
          item as Training,
          (item as Training).membersIds.length
        );
  }

  static mapMembers(item: Training, users: User[]): Training {
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

  static trainingToInfo(training: Training): TrainingInfo {
    this.mapPrescribedStats(training, training.membersIds.length);

    return {
      id: training.id,
      from: training.from,
      to: training.to,
      groupId: training.groupId,
      cycleId: training.cycleId,
      copiedFromId: training.copiedFromId,
      warmup: this.componentToInfo(training.warmup),
      cooldown: this.componentToInfo(training.cooldown),
      components: training.components.map((component) =>
        this.componentToInfo(component)
      ),
      stats: training.stats,
      prescribedStats: training.prescribedStats,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
    };
  }

  static componentToInfo(component: TrainingComponent): TrainingComponentInfo {
    return {
      id: component.id,
      color: component.color,
      from: component.from,
      to: component.to,
      subgroups: component.subgroups.map((subgroup) =>
        this.subgroupToInfo(subgroup)
      ),
      methodId: component.methodId,
      method: component.method,
      target: component.target,
      component: component.component,
      copiedFrom: component.copiedFrom,
    };
  }

  static subgroupToInfo(subgroup: Subgroup): SubgroupInfo {
    return {
      id: subgroup.id,
      prescribedStats: subgroup.prescribedStats,
    };
  }

  static getPrescribedWorkload(prescribedSet: ExerciseSet): PrescribedWorkload {
    const { paramValuesL, paramValuesR } = prescribedSet;
    const volWork1L = paramValuesL.find((p) => p.field === ParamType.VolWork1);
    const volWork1R = paramValuesR?.find((p) => p.field === ParamType.VolWork1);
    const volWork2L = paramValuesL.find((p) => p.field === ParamType.VolWork2);
    const volWork2R = paramValuesR?.find((p) => p.field === ParamType.VolWork2);
    const volRecL = paramValuesL.find((p) => p.field === ParamType.VolRec1);
    const volRecR = paramValuesR?.find((p) => p.field === ParamType.VolRec1);
    const intWork1L = paramValuesL.find((p) => p.field === ParamType.IntWork1);
    const intWork1R = paramValuesR?.find((p) => p.field === ParamType.IntWork1);
    const intWork2L = paramValuesL.find((p) => p.field === ParamType.IntWork2);
    const intWork2R = paramValuesR?.find((p) => p.field === ParamType.IntWork2);
    const intRecL = paramValuesL.find((p) => p.field === ParamType.IntRec1);
    const intRecR = paramValuesR?.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Type: this.parseSelected<VolType>(volWork1L),
      prescribedVolWork1ValueL: this.parseValue(volWork1L) as number,
      prescribedVolWork1ValueR: volWork1R
        ? (this.parseValue(volWork1R) as number)
        : undefined,
      volWork2Type: this.parseSelected<VolType>(volWork2L),
      prescribedVolWork2ValueL: this.parseValue(volWork2L) as number,
      prescribedVolWork2ValueR: volWork2R
        ? (this.parseValue(volWork2R) as number)
        : undefined,
      volRecType: this.parseSelected<VolType>(volRecL),
      prescribedVolRecValueL: this.parseValue(volRecL) as number,
      prescribedVolRecValueR: volRecR
        ? (this.parseValue(volRecR) as number)
        : undefined,
      intWork1Type: this.parseSelected<IntType>(intWork1L),
      prescribedIntWork1ValueL: this.parseValue(intWork1L),
      prescribedIntWork1ValueR: intWork1R
        ? this.parseValue(intWork1R)
        : undefined,
      intWork2Type: this.parseSelected<IntType>(intWork2L),
      prescribedIntWork2ValueL: this.parseValue(intWork2L),
      prescribedIntWork2ValueR: intWork2R
        ? this.parseValue(intWork2R)
        : undefined,
      intRecType: this.parseSelected<IntType>(intRecL),
      prescribedIntRecValueL: this.parseValue(intRecL),
      prescribedIntRecValueR: intRecR ? this.parseValue(intRecR) : undefined,
    };
  }

  static getPerscribedFieldName(
    param: Attribute,
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

  /**
   * Based on prescribed training, this method calculates average stats
   * for intensity and volume for each exercise in the training components
   * for all users in main group and subgroups.
   */
  static mapPrescribedStats(
    training: Training,
    numMembersTraining: number
  ): void {
    const stats: TrainingExerciseAverageStats[] = [];

    for (const component of training.components) {
      const numMembersMainGroup = // all members in training - members in all subgroups
        numMembersTraining -
        component.subgroups.reduce((sum, s) => sum + s.membersIds.length, 0);
      if (numMembersMainGroup <= 0) continue; // skip if no members in main group

      for (const superset of component.supersets) {
        for (const { id, sets } of superset.exercises) {
          const { intensity, volume } = this.getAverageIntVol(sets);
          const foundStat = stats.find((s) => s.exerciseId === id);

          if (foundStat) {
            foundStat.intensity += intensity * numMembersMainGroup;
            foundStat.volume += volume * numMembersMainGroup;
            foundStat.numMembers += numMembersMainGroup;
          } else {
            stats.push({
              intensity: intensity * numMembersMainGroup,
              volume: volume * numMembersMainGroup,
              numMembers: numMembersMainGroup,
              exerciseId: id,
              rootComponentId: component.id,
            });
          }
        }
      }

      for (const subgroup of component.subgroups) {
        const numMembersSubgroup = subgroup.membersIds.length;
        if (numMembersSubgroup === 0) continue; // skip empty subgroups

        const subgroupStats: TrainingExerciseAverageStats[] = [];
        for (const superset of subgroup.supersets) {
          for (const { id, sets } of superset.exercises) {
            const { intensity, volume } = this.getAverageIntVol(sets);

            const foundMain = stats.find((s) => s.exerciseId === id);
            const foundSubgroup = subgroupStats.find(
              (s) => s.exerciseId === id && s.rootComponentId === component.id
            );

            let subgroupStat: TrainingExerciseAverageStats | undefined;
            if (foundMain) {
              // "append" subgroup stats to main group stats to avoid duplicates
              foundMain.intensity += intensity * numMembersSubgroup;
              foundMain.volume += volume * numMembersSubgroup;
              foundMain.numMembers += numMembersSubgroup;
              subgroupStat = foundMain;
            } else {
              // create new stats for subgroup exercise
              subgroupStat = {
                intensity: intensity * numMembersSubgroup,
                volume: volume * numMembersSubgroup,
                numMembers: numMembersSubgroup,
                exerciseId: id,
                rootComponentId: component.id,
              };

              stats.push(subgroupStat);
            }

            // add subgroup stats to subgroupStats array
            if (foundSubgroup) {
              foundSubgroup.intensity += subgroupStat.intensity;
              foundSubgroup.volume += subgroupStat.volume;
              foundSubgroup.numMembers += subgroupStat.numMembers;
            } else subgroupStats.push(subgroupStat);
          }
        }

        subgroup.prescribedStats = subgroupStats.map((s) => {
          const intensity = s.intensity / s.numMembers;
          const volume = s.volume / s.numMembers;
          return { ...s, intensity, volume };
        });
      }
    }

    training.prescribedStats = stats.map((s) => {
      const intensity = s.intensity / s.numMembers; // average intensity
      const volume = s.volume / s.numMembers; // average volume
      return { ...s, intensity, volume };
    });
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

  /**
   * Calculates average intensity and volume for a list of sets.
   * It takes into account both left and right param values.
   * If there are no sets, it returns 0 for both intensity and volume.
   */
  static getAverageIntVol(
    sets: ExerciseSet[]
  ): Pick<TrainingExerciseAverageStats, 'intensity' | 'volume'> {
    const averages = this.calculateParamTypeAverages(sets);

    const intensity = parseFloat(averages[ParamType.IntWork1].toFixed(2));
    const volume = parseFloat(averages[ParamType.VolWork1].toFixed(2));

    return { intensity, volume };
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
