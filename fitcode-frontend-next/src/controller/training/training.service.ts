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
import type { TrainingReport } from './type/training-report.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { Cycle } from '../group/type/cycle.type';

const WARMUP_COMPONENT_ID = 'warmup';
const COOLDOWN_COMPONENT_ID = 'cooldown';

export class TrainingService {
  static getTrainingByAthlete(athleteId: string, training: Training): Training {
    const components = this.getTrainingComponents(training);
    const athleteComponents: TrainingComponent[] = [];

    for (const component of components) {
      const athleteComponent = structuredClone(component);
      athleteComponent.supersets = this.getSupersetsByAthlete(
        athleteId,
        athleteComponent
      );

      athleteComponents.push({ ...athleteComponent, subgroups: [] });
    }

    return {
      ...training,
      components: athleteComponents.filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID
      ),
      warmup: athleteComponents.find((c) => c.id === WARMUP_COMPONENT_ID)!,
      cooldown: athleteComponents.find((c) => c.id === COOLDOWN_COMPONENT_ID)!,
      membersIds: training.membersIds.filter((uid) => uid === athleteId),
    };
  }

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
        (pc) => data.components!.find((c) => c.id === pc.componentId)!
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

  static getTrainingComponents(training: Training): TrainingComponent[] {
    const { warmup, cooldown, components } = training;
    return [warmup, ...components, cooldown];
  }

  static getSupersetsByAthlete(
    athleteId: string,
    trainingComponent: TrainingComponent
  ): Superset[] {
    // athlete can be member of the following:
    //    - main group -> 0 subgroups
    //    - 1 root subgroup -> 1 subgroup, can be shared with other members in training
    //    - 1 child subgroup of root subgroup -> 2 subgroups (root & child), root can be shared with other members in training but child cannot
    //    - direct child of main group -> 1 subgroup, only this athlete is in it

    const subgroups = trainingComponent.subgroups.filter((s) =>
      s.membersIds.includes(athleteId)
    );

    if (subgroups.length === 1) {
      // root subgroup OR direct child of main group
      const subgroup = subgroups[0];
      if (subgroup.parentId === trainingComponent.id) return subgroup.supersets; // direct child of main group
      if (!subgroup.parentId) return subgroup.supersets; // root subgroup
      return subgroup.supersets; // case of child subgroup without correct parent
    }

    if (subgroups.length === 2) {
      // 2 subgroups - root and child
      const root = subgroups.find((s) => !s.parentId);
      if (!root) return trainingComponent.supersets; // case of 2 child subgroups without root

      const child = subgroups.find((s) => s.parentId === root.id);
      if (!child) return trainingComponent.supersets; // case of root subgroup without child

      return child.supersets;
    }

    return trainingComponent.supersets; // no subgroups, return all supersets
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
