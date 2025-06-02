import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { Component } from '../component/type/component.type';
import { Exercise } from '../exercise/type/exercise.type';
import { User } from '../user/type/user.type';
import { Training } from './type/training.type';
import { ExerciseSet } from './type/training-plan.type';
import { IntensityVolumeValues } from './type/intensity-volume-values.type';
import { Target } from '../target/type/target.type';

export class TrainingService {
  static mapComponents(item: Training, components: Component[]): Training {
    for (const tc of item.components)
      tc.component = components.find((c) => c.id === tc.id);

    item.warmup.component = components.find((c) => c.id === item.warmup.id);
    item.cooldown.component = components.find((c) => c.id === item.cooldown.id);

    return item;
  }

  static mapExercises(item: Training, exercises: Exercise[]): Training {
    for (const tc of item.components) {
      for (const s of tc.supersets)
        for (const e of s.exercises)
          e.exercise = exercises.find(({ id }) => id === e.id);

      for (const subgroup of tc.subgroups)
        for (const s of subgroup.supersets)
          for (const e of s.exercises)
            e.exercise = exercises.find(({ id }) => id === e.id);
    }

    return item;
  }

  static mapComponentsExercises(
    training: Training,
    components: Component[],
    exercises: Exercise[],
  ): Training {
    return this.mapExercises(
      this.mapComponents(training, components),
      exercises
    );
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
}
