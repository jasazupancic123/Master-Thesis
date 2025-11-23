import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes, getHours, setHours, setMinutes } from 'date-fns';

import { DeepPick } from '@src/common/interface/deep-pick.interface';
import { CommonService } from '@src/common/service/common.service';
import { ComponentRef } from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';

import { MAIN_GROUP_PARENT_ID } from '../constant/main-group-parent-id.constant';
import {
  AM_PM_HOUR_DIVIDER,
  MAX_NUM_COMPONENTS_IN_TRAINING,
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS,
} from '../constant/training-limits.constant';
import { TrainingActionRef } from '../dto/training-action.dto';
import { ExerciseParamField, ExerciseSet } from '../entity/exercise-set.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import {
  TrainingComponent,
  TrainingComponentWithoutTime,
} from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Workload } from '../entity/workload.entity';
import { MainSet } from '../enum/main-set.enum';
import { TrainingPeriod } from '../enum/training-period.enum';
import {
  UpdateSuperset,
  UpdateTrainingComponentWithoutTime,
} from '../interface/update-training.interface';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly common: CommonService,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
    private readonly exerciseParamService: ExerciseParamService,
    private readonly exerciseAttributeService: ExerciseAttributeService,
  ) {}

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

    if (subgroups.length === 1)
      // root subgroup OR direct child of main group
      return subgroups[0].supersets;

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
    const athleteComponents: TrainingComponent[] = [];

    for (const component of training.components) {
      const athleteComponent = structuredClone(component);
      athleteComponent.supersets = this.getSupersetsByAthlete(
        athleteId,
        athleteComponent,
      );

      athleteComponents.push({ ...athleteComponent, subgroups: [] });
    }

    return {
      ...training,
      components: athleteComponents,
      membersIds: training.membersIds.filter((uid) => uid === athleteId),
    };
  }

  hasLoadType(training: Training, loadType: ExerciseParamField): boolean {
    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises)
          for (const set of exercise.sets)
            if (this.exerciseParamService.getLoadField(set) === loadType)
              return true;

    return false;
  }

  modifyPrescribedParamValuesByType(
    training: Training,
    loadType: ExerciseParamField,
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

  applyWorkloadsToTraining(training: Training, workloads: Workload[]) {
    for (const component of training.components)
      for (
        let supersetIndex = 0;
        supersetIndex < component.supersets.length;
        supersetIndex++
      ) {
        const superset = component.supersets[supersetIndex];
        for (const exercise of superset.exercises)
          for (
            let setNumber = 1;
            setNumber <= exercise.sets.length;
            setNumber++
          ) {
            const workload = workloads.find(
              (w) =>
                w.trainingId === training.id &&
                w.componentId === component.id &&
                w.supersetIndex === supersetIndex &&
                w.exerciseId === exercise.id &&
                w.setNumber === setNumber,
            );

            if (!workload) continue;

            const set = exercise.sets[setNumber - 1];
            this.applyWorkloadToSet(set, workload);
          }
      }
  }

  findExercisesByLoadType(
    training: Training,
    loadType: ExerciseParamField,
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];

    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises) {
          if (exercises.find((e) => e.id === exercise.id)) continue;
          for (const set of exercise.sets)
            if (this.exerciseParamService.getLoadField(set) === loadType) {
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

  async getAllTrainingExercisesBySupersets(
    supersets: Superset[],
  ): Promise<Exercise[]> {
    return await this.exerciseService.getAll([
      ...new Set(supersets.flatMap((s) => s.exercises).map((e) => e.id)),
    ]);
  }

  findComponentOrFail(
    training: Training,
    componentId: string,
  ): TrainingComponent {
    const found = training.components.find((c) => c.id === componentId);
    if (!found) throw new NotFoundException(`Training component not found`);
    return found;
  }

  findSubgroupOrFail(
    component: TrainingComponent,
    subgroupId: string,
  ): Subgroup {
    const found = component.subgroups.find((s) => s.id === subgroupId);
    if (!found) throw new NotFoundException(`Subgroup not found`);
    return found;
  }

  validateTrainingComponents(
    newTrainingComponents: UpdateTrainingComponentWithoutTime[], // with warmup and cooldown
    trainingMemberIds: string[],
    data: { exercises: Exercise[] },
  ): TrainingComponentWithoutTime[] {
    const validTrainingComponents: TrainingComponentWithoutTime[] = [];

    const duplicates = new Set<string>();
    for (const newComponent of newTrainingComponents) {
      // validate components are valid
      const root = this.exerciseAttributeService.getRootMainComponent(
        newComponent.id,
      );

      if (!root) throw new NotFoundException('Component does not exist');

      if (!this.exerciseAttributeService.isRootComponent(newComponent.id))
        throw new NotFoundException(
          `Component cannot be selected for training`,
        );

      // check duplicates
      if (duplicates.has(newComponent.id))
        throw new BadRequestException(`Duplicate component ${root.name}`);
      duplicates.add(root.field);

      // validate supersets and subgroups
      const supersets = this.validateSupersets(newComponent, data);
      const subgroups = this.validateSubgroups(
        newComponent,
        trainingMemberIds,
        data,
      );

      validTrainingComponents.push({ ...newComponent, supersets, subgroups });
    }

    if (validTrainingComponents.length > MAX_NUM_COMPONENTS_IN_TRAINING)
      throw new ConflictException(
        `You can only have up to ${MAX_NUM_COMPONENTS_IN_TRAINING} components per training`,
      );

    return validTrainingComponents;
  }

  moveUserToVirtualSubgroup(
    training: Training,
    componentId: string,
    athleteId: string,
  ): Training {
    // 1. if user is in main group, create virtual subgroup with parent "default"
    // 2. if user is in regular subgroup, create virtual subgroup with the subgroup's parent
    // 3. if user is in virtual subgroup, do nothing

    // find user subgroups
    const trainingComponent = this.findComponentOrFail(training, componentId);
    const subgroups = trainingComponent.subgroups.filter((s) =>
      s.membersIds.includes(athleteId),
    );

    const newSubgroup: Subgroup = {
      id: athleteId,
      name: 'Athlete Subgroup',
      membersIds: [athleteId],
      supersets: structuredClone(
        this.getSupersetsByAthlete(athleteId, trainingComponent),
      ),
    };

    if (subgroups.length === 0)
      // 1st case (user in main group) - create virtual subgroup with parent "default"
      trainingComponent.subgroups = [
        ...trainingComponent.subgroups,
        { ...newSubgroup, parentId: MAIN_GROUP_PARENT_ID },
      ];
    else if (subgroups.length === 1) {
      // root subgroup OR direct child of main group
      const subgroup = subgroups[0];
      if (!subgroup.parentId)
        // 2nd case (user is in regular subgroup) - create virtual subgroup with the subgroup's parent
        trainingComponent.subgroups = [
          ...trainingComponent.subgroups,
          { ...newSubgroup, parentId: subgroup.id },
        ];

      // 3rd case (user already in virtual subgroup)
    }

    // 3rd case (user already in virtual subgroup)
    return training;
  }

  validateTrainingActionComponentRef(
    training: Training,
    ref: TrainingActionRef,
  ): { component: TrainingComponent } {
    const { componentId } = ref;

    if (!componentId)
      throw new BadRequestException(
        'You have to provide component id for this action',
      );

    const component = this.findComponentOrFail(training, componentId);
    return { component };
  }

  validateTrainingActionSupersetRef(
    training: Training,
    ref: TrainingActionRef,
  ): { component: TrainingComponent; superset: Superset } {
    const { subgroupId, supersetIndex } = ref;
    const { component } = this.validateTrainingActionComponentRef(
      training,
      ref,
    );

    if (supersetIndex === undefined)
      throw new BadRequestException(
        'You have to provide superset index for this action',
      );

    const supersets = subgroupId
      ? this.findSubgroupOrFail(component, subgroupId).supersets
      : component.supersets;

    const superset = supersets[supersetIndex];
    if (!superset) throw new NotFoundException('Superset not found');

    return { component, superset };
  }

  validateTrainingActionExerciseRef(
    training: Training,
    ref: TrainingActionRef,
  ): { superset: Superset; exercise: TrainingExercise; exerciseIndex: number } {
    const { exerciseId } = ref;
    const { superset } = this.validateTrainingActionSupersetRef(training, ref);

    if (!exerciseId)
      throw new BadRequestException(
        'You have to provide exercise id for this action',
      );

    const exerciseIndex = superset.exercises.findIndex(
      (e) => e.id === ref.exerciseId,
    );
    if (exerciseIndex === -1)
      throw new NotFoundException('Exercise not found in superset');

    const exercise = superset.exercises[exerciseIndex];
    return { superset, exercise, exerciseIndex };
  }

  validateSupersets(
    item: { supersets: UpdateSuperset[] },
    data: { exercises: Exercise[] },
  ): Superset[] {
    const newSupersets = item.supersets || [];
    const { exercises } = data;

    if (item.supersets.length > MAX_NUM_SUPERSETS)
      throw new BadRequestException(
        `You can only have up to ${MAX_NUM_SUPERSETS} supersets per component`,
      );

    const validSupersets: Superset[] = [];
    for (let i = 0; i < newSupersets.length; i++) {
      const superset = newSupersets[i];

      // validate max exercises per superset
      switch (superset.mainSet) {
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

        const errors = this.exerciseParamService.validateExerciseValues(
          trainingExercise as TrainingExercise,
          exercise,
        );

        if (errors.length > 0)
          throw new BadRequestException(this.common.generic.error(errors));

        validTrainingExercises.push({
          id: trainingExercise.id,
          sets: trainingExercise.sets,
          methodId: trainingExercise.methodId,
        });
      }

      validSupersets.push({ ...superset, exercises: validTrainingExercises });
    }

    const n = newSupersets.length;
    let state: 'start' | 'warmup' | 'normal' | 'cooldown' = 'start';

    for (let i = 0; i < n; i++) {
      const superset = newSupersets[i];

      // cannot be both warmup and cooldown
      if (superset.warmup && superset.cooldown)
        throw new BadRequestException(
          `Superset ${i + 1} cannot be both warmup and cooldown.`,
        );

      if (superset.warmup) {
        // warmups must appear only at the beginning and be consecutive
        if (state === 'normal' || state === 'cooldown')
          throw new BadRequestException(
            `Warmup supersets must be at the beginning`,
          );

        state = 'warmup';
        continue;
      }

      if (superset.cooldown) {
        state = 'cooldown';

        if (i < n - 1 && !newSupersets[i + 1].cooldown)
          throw new BadRequestException(
            `Cooldown supersets must be at the end`,
          );

        continue;
      }

      // normal superset
      if (state === 'cooldown')
        throw new BadRequestException(`Cooldown supersets must be at the end`);

      state = 'normal';
    }

    return validSupersets;
  }

  validateSubgroups(
    trainingComponent: UpdateTrainingComponentWithoutTime,
    trainingMemberIds: string[],
    data: { exercises: Exercise[] },
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
      const validSupersets = this.validateSupersets(subgroup, data);
      validSubgroups.push({
        id: subgroup.id,
        parentId: subgroup.parentId,
        name: subgroup.name,
        membersIds: subgroup.membersIds,
        supersets: validSupersets,
      });
    }

    return validSubgroups;
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
        targetId: sourceTrainingComponent.targetId,
        supersets: [],
        subgroups: [],
      };

    targetTrainingComponent.copiedFrom = {
      lastCopiedFromTrainingId: sourceTraining.id,
      rootCopiedFromTrainingId: sourceTrainingComponent.copiedFrom
        ? sourceTrainingComponent.copiedFrom.rootCopiedFromTrainingId
        : sourceTraining.id,
    };

    targetTrainingComponent.targetId = sourceTrainingComponent.targetId;

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
    loadType: ExerciseParamField,
    modify: (value: number, exerciseId: string) => number,
  ) {
    for (const exercise of superset.exercises)
      for (const set of exercise.sets)
        if (this.exerciseParamService.getLoadField(set) === loadType)
          this.exerciseParamService.modifyLoad(set, loadType, (current) =>
            modify(current, exercise.id),
          );
  }

  private applyWorkloadToSet(set: ExerciseSet, w: Workload) {
    function isDefined(value: number | undefined): value is number {
      return value !== undefined;
    }

    if (isDefined(w.reps)) set.reps = w.reps;
    if (isDefined(w.repsR)) set.repsR = w.repsR;
    if (isDefined(w.loadKg)) set.loadKg = w.loadKg;
    if (isDefined(w.loadKgR)) set.loadKgR = w.loadKgR;
    if (isDefined(w.vel)) set.vel = w.vel;
    if (isDefined(w.velR)) set.velR = w.velR;
    if (isDefined(w.tempoEcc)) set.tempoEcc = w.tempoEcc;
    if (isDefined(w.tempoIso)) set.tempoIso = w.tempoIso;
    if (isDefined(w.tempoCon)) set.tempoCon = w.tempoCon;
    if (isDefined(w.tempoIdle)) set.tempoIdle = w.tempoIdle;
    if (isDefined(w.eff)) set.eff = w.eff;
    if (isDefined(w.effR)) set.effR = w.effR;
    if (isDefined(w.time)) set.time = w.time;
    if (isDefined(w.timeR)) set.timeR = w.timeR;
    if (isDefined(w.dist)) set.dist = w.dist;
    if (isDefined(w.distR)) set.distR = w.distR;
    if (isDefined(w.recTime)) set.recTime = w.recTime;
    if (isDefined(w.recTimeR)) set.recTimeR = w.recTimeR;
    if (isDefined(w.recDist)) set.recDist = w.recDist;
    if (isDefined(w.recDistR)) set.recDistR = w.recDistR;
  }
}
