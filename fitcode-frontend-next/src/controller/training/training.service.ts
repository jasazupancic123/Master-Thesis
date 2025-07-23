import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { Component } from '../component/type/component.type';
import { Exercise } from '../exercise/type/exercise.type';
import { User } from '../user/type/user.type';
import { Training } from './type/training.type';
import { TrainingComponentInfo } from './type/training-component.type';
import { TrainingComponent } from './type/training-component.type';
import { ExerciseSet } from './type/exercise-set.type';
import { IntensityVolumeValues } from './type/intensity-volume-values.type';
import { Target } from '../target/type/target.type';
import { Method } from '../method/type/method.type';
import { TrainingInfo } from './type/training.type';
import { Subgroup } from './type/subgroup.type';
import { SubgroupInfo } from './type/subgroup.type';
import { PrescribedWorkload } from './type/workload-value.type';
import { IntType, ParamType, VolType } from '../component/enum/param.enum';
import { AttributeValue } from '../attribute/type/attribute-value.type';
import { Attribute } from '../attribute/type/attribute.type';

export class TrainingService {
  static mapComponents(item: Training, components: Component[]): Training;
  static mapComponents(
    item: TrainingInfo,
    components: Component[]
  ): TrainingInfo;
  static mapComponents(
    item: Training | TrainingInfo,
    components: Component[]
  ): Training | TrainingInfo {
    for (const tc of item.components)
      tc.component = components.find((c) => c.id === tc.id);

    item.warmup.component = components.find((c) => c.id === item.warmup.id);
    item.cooldown.component = components.find((c) => c.id === item.cooldown.id);

    return item;
  }

  private static isTrainingComponent(
    item: TrainingComponent | TrainingComponentInfo
  ): item is TrainingComponent {
    return 'supersets' in item;
  }

  static mapExercises(item: Training, exercises: Exercise[]): Training;
  static mapExercises(item: TrainingInfo, exercises: Exercise[]): TrainingInfo;
  static mapExercises(
    item: Training | TrainingInfo,
    exercises: Exercise[]
  ): Training | TrainingInfo {
    for (const tc of item.components) {
      if (!this.isTrainingComponent(tc)) continue;

      for (const s of tc.supersets)
        for (const e of s.exercises) {
          e.exercise = exercises.find(({ id }) => id === e.id);
          if (!Array.isArray(e.params)) e.params = Object.values(e.params);
        }

      for (const subgroup of tc.subgroups)
        for (const s of subgroup.supersets)
          for (const e of s.exercises) {
            e.exercise = exercises.find(({ id }) => id === e.id);
            if (!Array.isArray(e.params)) e.params = Object.values(e.params);
          }
    }

    if (this.isTrainingComponent(item.warmup)) {
      for (const s of item.warmup.supersets)
        for (const e of s.exercises) {
          e.exercise = exercises.find(({ id }) => id === e.id);
          if (!Array.isArray(e.params)) e.params = Object.values(e.params);
        }
    }

    if (this.isTrainingComponent(item.cooldown)) {
      for (const s of item.cooldown.supersets)
        for (const e of s.exercises) {
          e.exercise = exercises.find(({ id }) => id === e.id);
          if (!Array.isArray(e.params)) e.params = Object.values(e.params);
        }
    }

    return item;
  }

  static mapMethods(item: Training, methods: Method[]): Training;
  static mapMethods(item: TrainingInfo, methods: Method[]): TrainingInfo;
  static mapMethods(
    item: Training | TrainingInfo,
    methods: Method[]
  ): Training | TrainingInfo {
    for (const tc of item.components)
      tc.method = methods.find((m) => m.id === tc.methodId);

    return item;
  }

  static mapComponentsExercisesMethods(
    training: Training,
    components: Component[],
    exercises: Exercise[],
    methods: Method[]
  ): Training;
  static mapComponentsExercisesMethods(
    training: TrainingInfo,
    components: Component[],
    exercises: Exercise[],
    methods: Method[]
  ): TrainingInfo;
  static mapComponentsExercisesMethods(
    training: Training | TrainingInfo,
    components: Component[],
    exercises: Exercise[],
    methods: Method[]
  ): Training | TrainingInfo {
    return this.mapExercises(
      this.mapComponents(this.mapMethods(training, methods), components),
      exercises
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

  static getIntensityVolumeValues(sets: ExerciseSet[]): IntensityVolumeValues {
    const intensitySum = sets.reduce((sum, set) => {
      const intensityValue = set.paramValuesL.find(
        (pv) => pv.field === 'int1'
      )?.value;
      return sum + (intensityValue ? +intensityValue : 0);
    }, 0);

    const avgIntensity = intensitySum / sets.length;

    const volumeSum = sets.reduce((sum, set) => {
      const volumeValue = set.paramValuesL.find(
        (pv) => pv.field === 'vol1'
      )?.value;
      return sum + (volumeValue ? +volumeValue : 0);
    }, 0);

    const avgVolume = volumeSum / sets.length;
    return {
      intensity: avgIntensity,
      volume: avgVolume,
    };
  }

  static convertFromTrainingToTrainingMinimal(
    training: Training
  ): TrainingInfo {
    return {
      id: training.id,
      from: training.from,
      to: training.to,
      groupId: training.groupId,
      cycleId: training.cycleId,
      copiedFromId: training.copiedFromId,
      warmup: this.convertFromTrainingComponentToTrainingComponentMinimal(
        training.warmup
      ),
      cooldown: this.convertFromTrainingComponentToTrainingComponentMinimal(
        training.cooldown
      ),
      components: training.components.map((component) =>
        this.convertFromTrainingComponentToTrainingComponentMinimal(component)
      ),
      stats: training.stats,
      futureStats: training.futureStats,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
    };
  }

  static convertFromTrainingComponentToTrainingComponentMinimal(
    component: TrainingComponent
  ): TrainingComponentInfo {
    return {
      id: component.id,
      color: component.color,
      from: component.from,
      to: component.to,
      subgroups: component.subgroups.map((subgroup) =>
        this.convertFromSubgroupToSubgroupMinimal(subgroup)
      ),
      methodId: component.methodId,
      method: component.method,
      target: component.target,
      component: component.component,
      copiedFrom: component.copiedFrom,
    };
  }

  static convertFromSubgroupToSubgroupMinimal(
    subgroup: Subgroup
  ): SubgroupInfo {
    return {
      id: subgroup.id,
      futureStats: subgroup.futureStats,
    };
  }

  static getPrescribedWorkload(prescribedSet: ExerciseSet): PrescribedWorkload {
    const { paramValuesL, paramValuesR } = prescribedSet;
    const volWork1L = paramValuesL.find((p) => p.field === ParamType.VolWork1);
    const volWork1R = paramValuesR.find((p) => p.field === ParamType.VolWork1);
    const volWork2L = paramValuesL.find((p) => p.field === ParamType.VolWork2);
    const volWork2R = paramValuesR.find((p) => p.field === ParamType.VolWork2);
    const volRecL = paramValuesL.find((p) => p.field === ParamType.VolRec1);
    const volRecR = paramValuesR.find((p) => p.field === ParamType.VolRec1);
    const intWork1L = paramValuesL.find((p) => p.field === ParamType.IntWork1);
    const intWork1R = paramValuesR.find((p) => p.field === ParamType.IntWork1);
    const intWork2L = paramValuesL.find((p) => p.field === ParamType.IntWork2);
    const intWork2R = paramValuesR.find((p) => p.field === ParamType.IntWork2);
    const intRecL = paramValuesL.find((p) => p.field === ParamType.IntRec1);
    const intRecR = paramValuesR.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Type: this.parseSelected<VolType>(volWork1L),
      prescribedVolWork1ValueL: this.parseValue(volWork1L) as number,
      prescribedVolWork1ValueR: this.parseValue(volWork1R) as number,
      volWork2Type: this.parseSelected<VolType>(volWork2L),
      prescribedVolWork2ValueL: this.parseValue(volWork2L) as number,
      prescribedVolWork2ValueR: this.parseValue(volWork2R) as number,
      volRecType: this.parseSelected<VolType>(volRecL),
      prescribedVolRecValueL: this.parseValue(volRecL) as number,
      prescribedVolRecValueR: this.parseValue(volRecR) as number,
      intWork1Type: this.parseSelected<IntType>(intWork1L),
      prescribedIntWork1ValueL: this.parseValue(intWork1L),
      prescribedIntWork1ValueR: this.parseValue(intWork1R),
      intWork2Type: this.parseSelected<IntType>(intWork2L),
      prescribedIntWork2ValueL: this.parseValue(intWork2L),
      prescribedIntWork2ValueR: this.parseValue(intWork2R),
      intRecType: this.parseSelected<IntType>(intRecL),
      prescribedIntRecValueL: this.parseValue(intRecL),
      prescribedIntRecValueR: this.parseValue(intRecR),
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
