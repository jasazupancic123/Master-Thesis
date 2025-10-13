import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  addMinutes,
  getHours,
  setHours,
  setMinutes,
  subMinutes,
} from 'date-fns';

import { GLOBAL_EXERCISE_OWNER } from '@src//exercise/constant/global-exercise-owner.constant';
import { Institution } from '@src//institution/entity/institution.entity';
import { DeepPick } from '@src/common/interface/deep-pick.interface';
import { User } from '@src/common/type/firebase-auth.type';
import { ComponentRef } from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { Component } from '@src/component/entity/component.entity';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { Method } from '@src/method/entity/method.entity';

import { MAIN_GROUP_PARENT_ID } from '../constant/main-group-parent-id.constant';
import {
  AM_PM_HOUR_DIVIDER,
  DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
  MAX_NUM_COMPONENTS_IN_TRAINING,
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT,
  MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT,
} from '../constant/training-limits.constant';
import { Subgroup } from '../entity/subgroup.entity';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import {
  TrainingComponent,
  TrainingComponentWithoutTime,
} from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { LoadType } from '../enum/load-type.enum';
import { MainSet } from '../enum/main-set.enum';
import { TrainingPeriod } from '../enum/training-period.enum';
import {
  UpdateSuperset,
  UpdateTrainingComponentWithoutTime,
} from '../interface/update-training.interface';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly componentService: ComponentService,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
    private readonly exerciseParamService: ExerciseParamService,
  ) {}

  async getInstitution(exercise: Exercise): Promise<Institution | null> {
    if (exercise.ownerId !== GLOBAL_EXERCISE_OWNER)
      return await this.institutionService.findById({
        institutionId: exercise.ownerId,
      });

    return null;
  }

  getStartTime(period: TrainingPeriod, date = new Date()): Date {
    switch (period) {
      case TrainingPeriod.AM:
        return setHours(setMinutes(date, 0), 8); // 8:00 AM
      case TrainingPeriod.PM:
        return setHours(setMinutes(date, 0), 14); // 2:00 PM
    }
  }

  getPeriod(date: Date): TrainingPeriod {
    const hours = getHours(date);
    if (hours < AM_PM_HOUR_DIVIDER) return TrainingPeriod.AM;
    return TrainingPeriod.PM;
  }

  async validateCanViewExercise(user: User, exercise: Exercise) {
    const institution = await this.getInstitution(exercise);
    if (!this.exerciseService.canView(user, exercise, institution))
      throw new BadRequestException(
        `You cannot view exercise ${exercise.name}`,
      );
  }

  getTrainingComponents(training: Training): TrainingComponent[] {
    const { warmup, cooldown, components } = training;
    return [warmup, ...components, cooldown];
  }

  getSupersetsByAthlete(
    athleteId: string,
    trainingComponent: TrainingComponent,
  ): Superset[] {
    // athlete can be member of the following:
    //    - main group -> 0 subgroups
    //    - 1 root subgroup -> 1 subgroup, can be shared with other members in training
    //    - 1 child subgroup of root subgroup -> 2 subgroups (root & child), root can be shared with other members in training but child cannot
    //    - direct child of main group -> 1 subgroup, only this athlete is in it

    const subgroups = trainingComponent.subgroups.filter((s) =>
      s.membersIds.includes(athleteId),
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

  getTrainingByAthlete(athleteId: string, training: Training): Training {
    const components = this.getTrainingComponents(training);
    const athleteComponents: TrainingComponent[] = [];

    for (const component of components) {
      const athleteComponent = structuredClone(component);
      athleteComponent.supersets = this.getSupersetsByAthlete(
        athleteId,
        athleteComponent,
      );

      athleteComponents.push({ ...athleteComponent, subgroups: [] });
    }

    return {
      ...training,
      components: athleteComponents.filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
      ),
      warmup: athleteComponents.find((c) => c.id === WARMUP_COMPONENT_ID)!,
      cooldown: athleteComponents.find((c) => c.id === COOLDOWN_COMPONENT_ID)!,
      membersIds: training.membersIds.filter((uid) => uid === athleteId),
    };
  }

  hasLoadType(training: Training, loadType: LoadType): boolean {
    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises)
          for (const set of exercise.sets)
            if (set.loadType === loadType) return true;

    return false;
  }

  modifyPrescribedParamValuesByType(
    training: Training,
    loadType: LoadType,
    modify: (value: number, exerciseId: string) => number,
  ) {
    for (const component of training.components) {
      for (const superset of component.supersets)
        this.modifySupersetValuesByLoadType(superset, loadType, modify);

      for (const subgroup of component.subgroups)
        for (const superset of subgroup.supersets)
          this.modifySupersetValuesByLoadType(superset, loadType, modify);
    }
  }

  findExercisesByLoadType(
    training: Training,
    loadType: LoadType,
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];

    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises) {
          if (exercises.find((e) => e.id === exercise.id)) continue;
          for (const set of exercise.sets)
            if (set.loadType === loadType) {
              exercises.push(exercise);
              break;
            }
        }

    return exercises;
  }

  async getAllTrainingExercises(
    trainingComponents: DeepPick<
      TrainingComponent,
      'supersets.exercises.id' | 'subgroups.supersets.exercises.id'
    >[],
  ): Promise<Exercise[]> {
    const trainingExercises = trainingComponents.flatMap((c) => [
      ...c.supersets.flatMap((s) => s.exercises),
      ...c.subgroups.flatMap((s) => s.supersets.flatMap((s) => s.exercises)),
    ]);

    const ids = [...new Set(trainingExercises.map((e) => e.id))];
    return await this.exerciseService.getAll(ids);
  }

  findComponentOrFail(
    training: Training,
    componentId: string,
  ): TrainingComponent {
    const trainingComponents = this.getTrainingComponents(training);
    const foundComponent = trainingComponents.find((c) => c.id === componentId);

    if (!foundComponent)
      throw new NotFoundException(`Training component not found`);

    return foundComponent;
  }

  validateTrainingComponents(
    newTrainingComponents: UpdateTrainingComponentWithoutTime[], // with warmup and cooldown
    trainingMemberIds: string[],
    data: { exercises: Exercise[]; components: Component[]; methods: Method[] },
  ): TrainingComponentWithoutTime[] {
    const { components, methods } = data;
    const validTrainingComponents: TrainingComponentWithoutTime[] = [];

    const duplicates = new Set<string>();
    for (const newComponent of newTrainingComponents) {
      const component = components.find((c) => c.id === newComponent.id);

      // validate components are valid
      if (!component) throw new NotFoundException('Component does not exist');
      if (component.parentId)
        throw new BadRequestException(
          `Component ${component.name} cannot be selected for training`,
        );

      // validate method
      if (newComponent.methodId) {
        const method = methods.find((m) => m.id === newComponent.methodId);
        if (!method)
          throw new NotFoundException(
            'Method not found for training component',
          );
      }

      // check duplicates
      if (duplicates.has(newComponent.id))
        throw new BadRequestException(`Duplicate component ${component.name}`);
      duplicates.add(component.id);

      // validate supersets and subgroups
      const supersets = this.validateSupersets(
        newComponent,
        newComponent,
        data,
      );

      const subgroups = this.validateSubgroups(
        newComponent,
        trainingMemberIds,
        data,
      );

      validTrainingComponents.push({ ...newComponent, supersets, subgroups });
    }

    if (validTrainingComponents.length > MAX_NUM_COMPONENTS_IN_TRAINING + 2)
      // warmup and cooldown are already included in the count
      throw new ConflictException(
        `You can only have up to ${MAX_NUM_COMPONENTS_IN_TRAINING} components per training`,
      );

    return validTrainingComponents;
  }

  validateSupersets(
    trainingComponent: UpdateTrainingComponentWithoutTime,
    item: { supersets: UpdateSuperset[]; mainSet: MainSet },
    data: { components: Component[]; exercises: Exercise[]; methods: Method[] },
  ): Superset[] {
    const newSupersets = item.supersets || [];
    const mainSet = item.mainSet || trainingComponent.mainSet;
    const { components, exercises } = data;

    switch (mainSet) {
      case MainSet.BLOCK:
        if (newSupersets.length > MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT)
          throw new ConflictException(
            `You can only have up to ${MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT} supersets per training component for block sets`,
          );
        break;
      case MainSet.CIRCUIT:
        if (newSupersets.length > MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT)
          throw new ConflictException(
            `You can only have ${MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT} circuit set`,
          );
    }

    const component = components.find((c) => c.id === trainingComponent.id)!;
    const root = this.componentService.getRoot(component, components);

    const validSupersets: Superset[] = [];
    for (const superset of newSupersets) {
      // validate max exercises per superset
      switch (mainSet) {
        case MainSet.BLOCK:
          if (superset.exercises.length > MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET)
            throw new ConflictException(
              `You can only have up to ${MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET} exercises per superset for block sets`,
            );
          break;
        case MainSet.CIRCUIT:
          if (superset.exercises.length > MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET)
            throw new ConflictException(
              `You can only have up to ${MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET} exercises per superset for circuit sets`,
            );
      }

      // validate exercises
      const validTrainingExercises: TrainingExercise[] = [];
      for (const trainingExercise of superset.exercises) {
        const exercise = exercises.find((e) => e.id === trainingExercise.id);
        if (!exercise)
          throw new NotFoundException('Training exercise not found');

        for (const set of trainingExercise.sets) {
          const errors = [
            ...this.exerciseParamService.validateSetValues(exercise, set),
            ...this.exerciseParamService.validateMethods(
              set,
              data.methods,
              trainingComponent.methodId,
            ),
          ];

          if (errors.length > 0) {
            throw new BadRequestException(
              errors.map((e) => e.message).join(', '),
            );
          }
        }

        validTrainingExercises.push({
          id: trainingExercise.id,
          sets: trainingExercise.sets,
          params: root.params || [],
        });
      }

      validSupersets.push({ exercises: validTrainingExercises });
    }

    return validSupersets;
  }

  validateSubgroups(
    trainingComponent: UpdateTrainingComponentWithoutTime,
    trainingMemberIds: string[],
    data: {
      components: Component[];
      exercises: Exercise[];
      methods: Method[];
    },
  ): Subgroup[] {
    // member can be in exactly:
    //   - main group -> 0 subgroups
    //   - 1 root subgroup -> 1 subgroup, can be shared with other members in training
    //   - 1 child subgroup of root subgroup -> 2 subgroups (root & child), root can be shared with other members in training but child cannot
    //   - 1 direct child of main group -> 1 subgroup, only this athlete is in it

    const trainingMemberIdsSet = new Set(trainingMemberIds);
    const validSubgroups: Subgroup[] = [];

    for (const subgroup of trainingComponent.subgroups) {
      // validate members
      for (const userId of subgroup.membersIds)
        if (!trainingMemberIdsSet.has(userId))
          throw new ConflictException('Invalid member');

      const otherSubgroups = trainingComponent.subgroups.filter(
        (s) => s.id !== subgroup.id,
      );

      if (subgroup.parentId) {
        // either child subgroup or direct child of main group
        if (subgroup.parentId === MAIN_GROUP_PARENT_ID) {
          // direct child of main group
          if (subgroup.membersIds.length !== 1)
            throw new BadRequestException('Only one member can be selected');

          // check that no other subgroup has this member
          for (const other of otherSubgroups)
            if (other.membersIds.some((m) => subgroup.membersIds.includes(m)))
              throw new ConflictException(
                'Member is already in another subgroup',
              );

          // check that supersets are the same as in main group
          this.checkSupersetsEquality(
            subgroup.supersets,
            trainingComponent.supersets,
          );
        } else {
          // child of root subgroup
          const parent = otherSubgroups.find((s) => s.id === subgroup.parentId);
          if (!parent) throw new NotFoundException('Parent subgroup not found');

          // only 1 member allowed
          if (subgroup.membersIds.length !== 1)
            throw new BadRequestException('Only one member can be selected');

          // check that no other subgroup has this member (except for parent)
          const filteredOtherSubgroups = otherSubgroups.filter(
            (s) => s.id !== parent.id,
          );

          for (const other of filteredOtherSubgroups)
            if (other.membersIds.some((m) => subgroup.membersIds.includes(m)))
              throw new ConflictException(
                'Member is already in another subgroup',
              );

          // check that supersets are the same as in main group
          this.checkSupersetsEquality(subgroup.supersets, parent.supersets);
        }
      } else {
        // root subgroup
        // check that no other subgroup has these members (expect for child subgroups)
        const filteredOtherSubgroups = otherSubgroups.filter(
          (s) => s.parentId !== subgroup.id,
        );

        for (const other of filteredOtherSubgroups)
          if (other.membersIds.some((m) => subgroup.membersIds.includes(m)))
            throw new ConflictException(
              'Member is already in another subgroup',
            );
      }

      // validate supersets
      const validSupersets = this.validateSupersets(
        trainingComponent,
        subgroup,
        data,
      );

      validSubgroups.push({
        id: subgroup.id,
        parentId: subgroup.parentId,
        name: subgroup.name,
        membersIds: subgroup.membersIds,
        supersets: validSupersets,
        mainSet: subgroup.mainSet,
      });
    }

    return validSubgroups;
  }

  /**
   * Generates warmup and cooldown components based on the provided training components.
   *
   * @param components - Array of training components (without warmup and cooldown) to determine the warmup and cooldown times.
   */
  getWarmupAndCooldown(components: Pick<TrainingComponent, 'from' | 'to'>[]): {
    warmup: TrainingComponent;
    cooldown: TrainingComponent;
  } {
    const sorted = components.sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    if (sorted.length === 0)
      throw new BadRequestException('Training must have atleast one component');

    const startTime = new Date(sorted[0].from);
    const endTime = new Date(sorted[sorted.length - 1].to);

    const warmup: TrainingComponent = {
      id: WARMUP_COMPONENT_ID,
      from: subMinutes(
        startTime,
        DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
      to: startTime,
      mainSet: MainSet.BLOCK,
      supersets: [],
      subgroups: [],
    };

    const cooldown: TrainingComponent = {
      id: COOLDOWN_COMPONENT_ID,
      from: endTime,
      to: addMinutes(
        endTime,
        DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
      mainSet: MainSet.BLOCK,
      supersets: [],
      subgroups: [],
    };

    return { warmup, cooldown };
  }

  copyOrOverrideComponent(
    ref: ComponentRef,
    sourceTraining: Training,
    targetTraining: Training,
    options: {
      overrideSupersets?: boolean;
      overrideDirectSubgroups?: boolean;
      overrideOtherSubgroups?: boolean;
      overrideTimes?: boolean;
    } = {
      // by default, override supersets, but not subgroups or times
      overrideSupersets: true,
      overrideDirectSubgroups: false,
      overrideOtherSubgroups: false,
      overrideTimes: false,
    },
  ): void {
    const sourceTrainingComponent = this.findComponentOrFail(
      sourceTraining,
      ref.componentId,
    );

    // find existing component in target training or create a new one
    const foundTargetTrainingComponent = targetTraining.components.find(
      (c) => c.id === sourceTrainingComponent.id,
    );

    const lastTargetTrainingComponent =
      targetTraining.components[targetTraining.components.length - 1];

    const targetTrainingComponent: TrainingComponent =
      foundTargetTrainingComponent || {
        id: sourceTrainingComponent.id,
        from: lastTargetTrainingComponent.from,
        to: addMinutes(lastTargetTrainingComponent.from, 30),
        target: sourceTrainingComponent.target,
        methodId: sourceTrainingComponent.methodId,
        mainSet: sourceTrainingComponent.mainSet,
        supersets: [],
        subgroups: [],
      };

    targetTrainingComponent.copiedFrom = {
      lastCopiedFromTrainingId: sourceTraining.id,
      rootCopiedFromTrainingId: sourceTrainingComponent.copiedFrom
        ? sourceTrainingComponent.copiedFrom.rootCopiedFromTrainingId
        : sourceTraining.id,
    };

    targetTrainingComponent.methodId = sourceTrainingComponent.methodId;
    targetTrainingComponent.target = sourceTrainingComponent.target;
    targetTrainingComponent.mainSet = sourceTrainingComponent.mainSet;

    if (options) {
      if (options.overrideSupersets)
        targetTrainingComponent.supersets = structuredClone(
          sourceTrainingComponent.supersets,
        );

      // direct subgroups are subgroups with main group as parent
      if (options.overrideDirectSubgroups || options.overrideOtherSubgroups) {
        const directSubgroups = options?.overrideDirectSubgroups
          ? sourceTrainingComponent.subgroups.filter(
              (s) => s.parentId === MAIN_GROUP_PARENT_ID,
            )
          : [];

        // other subgroups are root subgroups or their children
        const otherSubgroups = options?.overrideOtherSubgroups
          ? sourceTrainingComponent.subgroups.filter(
              (s) => !s.parentId || s.parentId !== MAIN_GROUP_PARENT_ID,
            )
          : [];

        targetTrainingComponent.subgroups = structuredClone(
          directSubgroups.concat(otherSubgroups),
        );
      }

      if (options.overrideTimes) {
        targetTrainingComponent.from = sourceTrainingComponent.from;
        targetTrainingComponent.to = sourceTrainingComponent.to;
      }
    }

    if (!foundTargetTrainingComponent)
      targetTraining.components.push(targetTrainingComponent);
    else
      targetTraining.components = targetTraining.components.map((c) =>
        c.id === sourceTrainingComponent.id ? targetTrainingComponent : c,
      );
  }

  /**
   * Copies a subgroup from the source training component to the target training component. If
   * subgroup already exists in the target training component, it overrides it, else it creates
   * a new one. It also arranges members correctly (member of a training can be exactly in 0, 1
   * or 2 subgroups - 1 for root subgroups and 2 for child subgroups where member is duplicated).
   * If any new rearrange subgroup has no members, it will be removed from the target training.
   *
   * @example
   * ```ts
   * const sourceTrainingComponent = {
   *   id: 'c1',
   *   subgroups: [
   *     { id: 's1', membersIds: ['anna', 'bob', 'charlie'] },
   *     { id: 's2', membersIds: ['bob'], parentId: 's1' },
   *   ]
   * }
   *
   * const targetTrainingComponent = {
   *   id: 'c1',
   *   subgroups: [
   *     { id: 's3', membersIds: ['anna', 'tina'] }
   *   ]
   * }
   *
   * copySubgroup('s1', sourceTrainingComponent, targetTrainingComponent);
   * // targetTrainingComponent.subgroups will now contain:
   * // [
   * //   { id: 's1', membersIds: ['anna', 'bob', 'charlie'] }, // copied from source
   * //   { id: 's3', membersIds: ['tina'] }, // 'anna' is already in 's1', so it is removed
   * // ]
   * ```
   *
   * @note
   * Source training component is needed as an argument since subgroups are nested 2 levels deep - they
   * can be root subgroups or child subgroups (with another root subgroup as parent). When copying
   * root subgroup, we also need to find its children and copy them to (all subgroups are saved in a
   * flat array), that's why this parameter is needed.
   */
  copyOrOverrideSubgroup(
    subgroupId: string,
    sourceTrainingComponent: TrainingComponent,
    targetTraining: Training,
  ) {
    const targetTrainingComponent = targetTraining.components.find(
      (c) => c.id === sourceTrainingComponent.id,
    );

    // only copy subgroups if target training component exists
    if (!targetTrainingComponent) return;

    const sourceSubgroup = sourceTrainingComponent.subgroups.find(
      (s) => s.id === subgroupId,
    );

    if (!sourceSubgroup)
      throw new NotFoundException(`Subgroup with id ${subgroupId} not found`);

    let subgroupsToCopy: Subgroup[] = [];
    if (!sourceSubgroup.parentId) {
      // root → copy root + children
      const children = sourceTrainingComponent.subgroups.filter(
        (s) => s.parentId === sourceSubgroup.id,
      );

      subgroupsToCopy = [sourceSubgroup, ...children];
    } else if (sourceSubgroup.parentId === MAIN_GROUP_PARENT_ID) {
      // direct child of main group → copy only child
      subgroupsToCopy = [sourceSubgroup];
    } else {
      // child → copy parent + child
      const parent = sourceTrainingComponent.subgroups.find(
        (s) => s.id === sourceSubgroup.parentId,
      );

      subgroupsToCopy = parent
        ? [parent, sourceSubgroup]
        : [{ ...sourceSubgroup, parentId: undefined }]; // if parent not found, make it root
    }

    // clone before modifying
    subgroupsToCopy = subgroupsToCopy.map((s) => structuredClone(s));
    const rootSubgroup = subgroupsToCopy[0]; // contains all members

    // remove existing subgroups with same IDs from target
    targetTrainingComponent.subgroups =
      targetTrainingComponent.subgroups.filter(
        (s) => !subgroupsToCopy.some((c) => c.id === s.id),
      );

    // remove overlapping members from other target subgroups
    targetTrainingComponent.subgroups.forEach((t) => {
      t.membersIds = t.membersIds.filter(
        (m) => !rootSubgroup.membersIds.includes(m),
      );
    });

    // remove empty subgroups
    targetTrainingComponent.subgroups =
      targetTrainingComponent.subgroups.filter((s) => s.membersIds.length > 0);

    // add subgroups to target training component
    targetTrainingComponent.subgroups.push(...subgroupsToCopy);

    // final cleanup for any empty subgroups
    targetTrainingComponent.subgroups =
      targetTrainingComponent.subgroups.filter((s) => s.membersIds.length > 0);
  }

  private checkSupersetsEquality(
    sup1: DeepPick<Superset, 'exercises.id' | 'exercises.sets'>[],
    sup2: DeepPick<Superset, 'exercises.id' | 'exercises.sets'>[],
  ) {
    const error = new BadRequestException(
      'Training prescription must be the same for all members in the selected group',
    );

    if (sup1.length !== sup2.length) throw error;

    for (let supersetIndex = 0; supersetIndex < sup1.length; supersetIndex++) {
      const s1 = sup1[supersetIndex];
      const s2 = sup2[supersetIndex];

      if (!s2) throw error;
      if (s1.exercises.length !== s2.exercises.length) throw error;

      for (
        let exerciseIndex = 0;
        exerciseIndex < s1.exercises.length;
        exerciseIndex++
      ) {
        const e1 = s1.exercises[exerciseIndex];
        const e2 = s2.exercises[exerciseIndex];
        if (!e2 || e1.id !== e2.id) throw error;
      }
    }
  }

  private modifySupersetValuesByLoadType(
    superset: Superset,
    loadType: LoadType,
    modify: (value: number, exerciseId: string) => number,
  ) {
    for (const exercise of superset.exercises)
      for (const set of exercise.sets)
        if (set.loadType === loadType)
          this.exerciseParamService.modifyLoad(set, loadType, (current) =>
            modify(current, exercise.id),
          );
  }
}
