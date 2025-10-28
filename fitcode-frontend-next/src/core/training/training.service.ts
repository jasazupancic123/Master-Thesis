import type { AuthUser } from '../auth/type/user.type';
import type { Component } from '../component/type/component.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { Group } from '../group/type/group.type';
import type { Institution } from '../institution/type/institution.type';
import type { Method } from '../method/type/method.type';
import type { Training } from './type/training.type';
import type { TrainingReport } from './type/training-report.type';

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
          for (const e of s.exercises)
            e.exercise = data.exercises.find(({ id }) => id === e.id);

        for (const subgroup of tc.subgroups)
          for (const s of subgroup.supersets)
            for (const e of s.exercises)
              e.exercise = data.exercises.find(({ id }) => id === e.id);
      }

      for (const s of item.warmup.supersets)
        for (const e of s.exercises)
          e.exercise = data.exercises.find(({ id }) => id === e.id);

      for (const s of item.cooldown.supersets)
        for (const e of s.exercises)
          e.exercise = data.exercises.find(({ id }) => id === e.id);
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
}
