import { addMinutes } from 'date-fns';

import type { Superset } from '../type/superset.type';
import type { Training } from '../type/training.type';
import type { TrainingComponent } from '../type/training-component.type';
import type { TrainingExercise } from '../type/training-exercise.type';
import { TrainingComponentUtil } from './component.util';
import { TrainingExerciseSetUtil } from './set.util';
import { TrainingSubgroupUtil } from './subgroup.util';
import { TrainingSupersetUtil } from './superset.util';
import { WorkloadUtil } from './workload.util';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { app } from '@/core/app.service';

export class TrainingUtil {
  readonly component: TrainingComponentUtil;
  readonly subgroup: TrainingSubgroupUtil;
  readonly superset: TrainingSupersetUtil;
  readonly set: TrainingExerciseSetUtil;
  readonly workload: WorkloadUtil;

  constructor() {
    this.component = new TrainingComponentUtil();
    this.subgroup = new TrainingSubgroupUtil();
    this.superset = new TrainingSupersetUtil();
    this.set = new TrainingExerciseSetUtil();
    this.workload = new WorkloadUtil();
  }

  stub(userId: string, data?: Partial<Training>): Training {
    return {
      id: data?.id || 'temp-id' + Math.random().toString(36).substring(2, 9),
      createdAt: data?.createdAt || new Date(),
      updatedAt: data?.updatedAt || new Date(),
      from: data?.from || new Date(),
      to: data?.to || addMinutes(new Date(), 60),
      institutionId: data?.institutionId,
      groupId: data?.groupId,
      cycleId: data?.cycleId,
      ownerId: userId,
      membersIds: data?.membersIds || [],
      copiedFromId: data?.copiedFromId,
      warmup: data?.warmup || app.training.component.stub(WARMUP_ID),
      cooldown: data?.cooldown || app.training.component.stub(COOLDOWN_ID),
      components: data?.components || [],
    };
  }

  getAthleteTraining(athleteId: string, training: Training): Training {
    const components = this.getComponents(training);
    const athleteComponents: TrainingComponent[] = [];

    for (const component of components) {
      const athleteComponent = structuredClone(component);
      athleteComponent.supersets = this.getAthleteSupersets(
        athleteId,
        athleteComponent
      );

      athleteComponents.push({ ...athleteComponent, subgroups: [] });
    }

    return {
      ...training,
      warmup: athleteComponents.find((c) => c.id === WARMUP_ID)!,
      cooldown: athleteComponents.find((c) => c.id === COOLDOWN_ID)!,
      membersIds: training.membersIds.filter((uid) => uid === athleteId),
      components: athleteComponents.filter(
        (c) => c.id !== WARMUP_ID && c.id !== COOLDOWN_ID
      ),
    };
  }

  getComponents(training: Training): TrainingComponent[] {
    return [training.warmup, ...training.components, training.cooldown];
  }

  getAthleteSupersets(
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

  getExercises(
    training: Training,
    selected?: {
      componentId?: string;
      subgroupId?: string;
    }
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];

    const components = this.getComponents(training);
    for (const component of components) {
      let supersets: Superset[] = [];
      if (selected?.componentId && component.id !== selected.componentId)
        continue;

      if (selected?.subgroupId) {
        const subgroup = component.subgroups.find(
          (sg) => sg.id === selected.subgroupId
        );

        if (subgroup) supersets = subgroup.supersets;
      } else supersets = component.supersets;

      exercises.push(...supersets.flatMap((s) => s.exercises));
    }

    return exercises;
  }

  getMainMembers(training: Training): string[] {
    // Get members who are not in any subgroup
    const members = new Set(training.membersIds);
    for (const component of training.components)
      for (const subgroup of component.subgroups)
        for (const memberId of subgroup.membersIds) members.delete(memberId);

    return Array.from(members);
  }

  getDurationText(training: Training) {
    const from = new Date(training.from);
    const to = new Date(training.to);

    const durationMs = to.getTime() - from.getTime();
    const totalMinutes = Math.floor(durationMs / 1000 / 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const durationText = `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
    return durationText;
  }
}
