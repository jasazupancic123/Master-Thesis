import type { AuthUser } from '../auth/type/user.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { Group } from '../institution/type/group.type';
import type { Institution } from '../institution/type/institution.type';
import type { Superset } from './type/superset.type';
import type { ActiveTraining, Training } from './type/training.type';
import type { TrainingReport } from './type/training-report.type';

export class TrainingService {
  static mapData<T extends Training>(
    item: T,
    data: { exercises?: Exercise[] }
  ) {
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
    }

    return item;
  }

  static mapActiveTraining(
    training: ActiveTraining | null,
    data: { exercises?: Exercise[] }
  ): ActiveTraining | null {
    if (!training) return training;

    if (data.exercises) {
      for (const tc of training.components) {
        for (const s of tc.supersets)
          for (const e of s.exercises)
            e.exercise = data.exercises.find(({ id }) => id === e.id);

        for (const subgroup of tc.subgroups)
          for (const s of subgroup.supersets)
            for (const e of s.exercises)
              e.exercise = data.exercises.find(({ id }) => id === e.id);
      }
    }

    return training;
  }

  static mapSupersets(supersets: Superset[], data: { exercises?: Exercise[] }) {
    if (data.exercises)
      for (const s of supersets)
        for (const e of s.exercises)
          e.exercise = data.exercises.find(({ id }) => id === e.id);
  }

  static mapMembers(item: Training, users: AuthUser[]): Training {
    item.members = item.membersIds.map(
      (id) => users.find((u) => u.uid === id)!
    );

    return item;
  }

  static mapReport(
    item: TrainingReport,
    data: { institutions?: Institution[]; groups?: Group[] }
  ): TrainingReport {
    if (data.institutions)
      item.institution = data.institutions.find(
        (inst) => inst.id === item.institutionId
      );

    if (data.groups) {
      item.group = data.groups.find((g) => g.id === item.groupId);
      item.cycle = item.group?.cycles.find((c) => c.id === item.cycleId);
    }

    return item;
  }
}
