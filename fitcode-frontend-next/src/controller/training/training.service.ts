import { Component } from '../component/type/component.type';
import { Exercise } from '../exercise/type/exercise.type';
import { User } from '../user/type/user.type';
import { Training } from './type/training.type';

export class TrainingService {
  static mapComponents(item: Training, components: Component[]): Training {
    for (const tc of item.components)
      tc.component = components.find((c) => c.id === tc.id);

    return item;
  }

  static mapExercises(item: Training, exercises: Exercise[]): Training {
    for (const tc of item.components) {
      for (const s of tc.supersets)
        for (const e of s.exercises)
          e.exercise = exercises.find(({ id }) => id === e.id) || null;

      for (const subgroup of tc.subgroups)
        for (const s of subgroup.supersets)
          for (const e of s.exercises)
            e.exercise = exercises.find(({ id }) => id === e.id) || null;
    }

    return item;
  }

  static mapMembers(item: Training, users: User[]): Training {
    item.members = item.membersIds.map(
      (id) => users.find((u) => u.uid === id)!
    );

    return item;
  }

  static mapAvailableMembers(training: Training): Training {
    const subgroupMembersIds = training.components.flatMap((component) =>
      component.subgroups.flatMap((subgroup) => subgroup.membersIds)
    );

    const allSubgroupMembersIds = new Set(subgroupMembersIds);
    const availableMembersIds = training.membersIds.filter(
      (memberId) => !allSubgroupMembersIds.has(memberId)
    );

    training.availableMembersIds = availableMembersIds;
    return training;
  }
}
