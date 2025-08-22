import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes, subMinutes } from 'date-fns';

import { GLOBAL_EXERCISE_OWNER } from '@src//exercise/constant/global-exercise-owner.constant';
import { Institution } from '@src//institution/entity/institution.entity';
import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { DeepPick } from '@src/common/interface/deep-pick.interface';
import { CommonService } from '@src/common/service/common.service';
import { Update } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  ComponentRef,
  TrainingComponentRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { Component } from '@src/component/entity/component.entity';
import { ParamType, VolWorkSetType } from '@src/component/enum/param.enum';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { Method } from '@src/method/entity/method.entity';

import { DEFAULT_WARMUP_AND_COOLDOWN_DURATION } from '../constant/training-component-duration.constant';
import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseAverageStats } from '../entity/training-exercise-average-stats.entity';
import { MainSet } from '../enum/main-set.enum';
import {
  UpdateSuperset,
  UpdateTrainingComponent,
} from '../interface/update-training.interface';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly commonService: CommonService,
    private readonly attributeService: AttributeService,
    private readonly institutionService: InstitutionService,
    private readonly componentService: ComponentService,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
    @Inject(forwardRef(() => ExerciseAttributeValueRepository))
    private readonly exerciseAttributeValueRepository: Wrapper<ExerciseAttributeValueRepository>,
  ) {}

  async getInstitution(exercise: Exercise): Promise<Institution | null> {
    if (exercise.ownerId !== GLOBAL_EXERCISE_OWNER)
      return await this.institutionService.getDoc({
        institutionId: exercise.ownerId,
      });

    return null;
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

  getAddComponentsQuery(
    training: Training,
    input: Update<TrainingComponent>[],
  ): [Update<Training>, Training] {
    const lastComponent = training.components[training.components.length - 1];

    const query: Update<Training> = {
      to: training.cooldown.to,
      components: [
        ...training.components.filter(
          (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
        ),
        ...input.map((c) => ({
          id: c.id,
          color: c.color,
          from: c.from ? c.from : addMinutes(lastComponent.from, 30),
          to: c.to ? c.to : addMinutes(lastComponent.from, 60),
          completedMembersIds: [],
          mainSet: c.mainSet || MainSet.BLOCK,
          target: c.target,
          methodId: c.methodId,
          subgroups: [],
          supersets: [],
        })),
      ],
    };

    training.to = query.to;
    training.components = query.components;
    return [query, training];
  }

  getDeleteComponentQuery(
    training: Training,
    ref: TrainingComponentRef,
  ): [Update<Training>, Training] {
    const updatedComponents = training.components.filter(
      (c) => c.id !== ref.componentId,
    );

    const query: Update<Training> = { components: updatedComponents };
    training.components = updatedComponents;

    return [query, training];
  }

  getAddCompletedMemberQuery(
    training: Training,
    ref: { componentId: string; uid: string },
  ): [Update<Training>, Training] {
    const { componentId, uid } = ref;

    // add completed member to the component
    this.findComponentOrFail(training, componentId);
    training.components = training.components.map((c) =>
      c.id !== componentId
        ? c
        : { ...c, completedMembersIds: [...c.completedMembersIds, uid] },
    );

    // check if training is completed and update accordingly
    const completedMembersIds = training.completedMembersIds || [];
    if (this.isTrainingCompleted(training, uid))
      if (!completedMembersIds.includes(uid)) {
        completedMembersIds.push(uid); // athlete completed the training
        training.completedMembersIds = completedMembersIds;
      }

    const query: Update<Training> = {
      completedMembersIds,
      components: training.components,
    };

    return [query, training];
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
    const exercises = await this.exerciseService.getAll(ids);

    return await Promise.all(
      exercises.map(async (e) => ({
        ...e,
        attributeValues:
          await this.exerciseAttributeValueRepository.getAllByExercise({
            exerciseId: e.id,
          }),
      })),
    );
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

  /**
   * Called when athlete completes training component, used to recalculate average
   * stats for exercises.
   */
  recalculateCompletedTrainingStats(
    trainingComponentId: string,
    completedStats: TrainingExerciseAverageStats[], // existing training stats
    completedExercises: CompletedTrainingExercise[], // completed exercises by athlete
  ) {
    const stats: TrainingExerciseAverageStats[] = completedStats.filter(
      (s) => s.rootComponentId === trainingComponentId,
    );

    for (const { id, sets } of completedExercises) {
      const { intensity, volume } = this.getAverageIntVol(sets);
      const foundStat =
        stats.find((s) => s.exerciseId === id) ||
        completedStats.find((s) => s.exerciseId === id); // it's possible that one exercise is completed in multiple supersets

      if (foundStat) {
        // update existing stat
        foundStat.intensity += intensity;
        foundStat.volume += volume;
        foundStat.numMembers += 1;
      } else {
        // create new stat for completed exercise
        completedStats.push({
          intensity,
          volume,
          numMembers: 1,
          exerciseId: id,
          rootComponentId: trainingComponentId,
        });
      }
    }

    return completedStats.map((s) => {
      const intensity = parseFloat(s.intensity.toFixed(2));
      const volume = parseFloat(s.volume.toFixed(2));
      return { ...s, intensity, volume };
    });
  }

  isTrainingCompleted(training: Training, userId: string) {
    return training.components.every((c) =>
      c.completedMembersIds.includes(userId),
    );
  }

  validateTrainingComponents(
    existingTraining: Training | null,
    newTrainingComponents: UpdateTrainingComponent[], // with warmup and cooldown
    trainingMemberIds: string[],
    data: {
      exercises: Exercise[];
      components: Component[];
      methods: Method[];
      attributes: Attribute[];
    },
  ): TrainingComponent[] {
    const { components, methods } = data;
    const validTrainingComponents: TrainingComponent[] = [];
    const duplicates = new Set<string>();

    for (let i = 0; i < newTrainingComponents.length; i++) {
      const curr = newTrainingComponents[i];
      const component = components.find((c) => c.id === curr.id);
      const existingTrainingComponent = existingTraining?.components?.find(
        (c) => c.id === curr.id,
      );

      // validate components are valid
      if (!component) throw new NotFoundException('Component does not exist');
      if (component.parentId)
        throw new BadRequestException(
          `Component ${component.name} cannot be selected for training`,
        );

      // validate method
      if (curr.methodId) {
        const method = methods.find((m) => m.id === curr.methodId);
        if (!method)
          throw new NotFoundException(
            'Method not found for training component',
          );
      }

      // check duplicates
      if (duplicates.has(curr.id))
        throw new BadRequestException(`Duplicate component ${component.name}`);
      duplicates.add(component.id);

      // validate training component times
      const next = newTrainingComponents[i + 1];
      if (next) {
        const nextComponent = components.find((c) => c.id === next.id);
        if (i < newTrainingComponents.length - 1 && nextComponent)
          if (curr.from >= next.from)
            throw new BadRequestException(
              `Component ${component.name} has to start before ${nextComponent.name}`,
            );
      }

      // validate supersets and subgroups
      const supersets = this.validateSupersets(curr, curr.supersets, data);
      const subgroups = this.validateSubgroups(curr, trainingMemberIds, data);

      validTrainingComponents.push({
        ...curr,
        supersets,
        subgroups,
        completedMembersIds:
          existingTrainingComponent?.completedMembersIds || [],
      });
    }

    if (validTrainingComponents.length > 7)
      // warmup and cooldown are already included in the count
      throw new ConflictException(
        'You can only have up to 5 components per training',
      );

    return validTrainingComponents;
  }

  populateTrainingExerciseParams(
    trainingComponents: DeepPick<
      TrainingComponent,
      'id' | 'supersets.exercises' | 'subgroups.supersets.exercises'
    >[],
    components: Component[],
    exercises: Exercise[], // populate exercise attributes
    attributes: Attribute[],
  ) {
    for (const tComponent of trainingComponents) {
      if ([WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(tComponent.id))
        continue;

      const component = components.find((c) => c.id === tComponent.id)!;
      const root = this.componentService.getRoot(component, components);
      const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

      for (const s of tComponent.supersets)
        for (const tExercise of s.exercises) {
          const exercise = exercises.find((e) => e.id === tExercise.id)!;
          if (!exercise) continue;

          const params = this.componentService.getComponentParamAttributes(
            componentParams,
            exercise.attributeValues,
            attributes,
          );

          tExercise.params = this.componentService.getParamAttributes(params);
          tExercise.sets = this.getSets(
            exercise.isBilateral,
            tExercise.params,
            tExercise.sets,
          );
        }

      for (const subgroup of tComponent.subgroups)
        for (const s of subgroup.supersets)
          for (const tExercise of s.exercises) {
            const exercise = exercises.find((e) => e.id === tExercise.id)!;
            if (!exercise) continue;

            const params = this.componentService.getComponentParamAttributes(
              componentParams,
              exercise.attributeValues,
              attributes,
            );

            tExercise.params = this.componentService.getParamAttributes(params);
            tExercise.sets = this.getSets(
              exercise.isBilateral,
              tExercise.params,
              tExercise.sets,
            );
          }
    }
  }

  validateSupersets(
    trainingComponent: UpdateTrainingComponent,
    newSupersets: UpdateSuperset[],
    data: {
      components: Component[];
      exercises: Exercise[];
      attributes: Attribute[];
      methods: Method[];
    },
  ): Superset[] {
    const { components, exercises, attributes, methods } = data;

    if (newSupersets.length > 8)
      throw new ConflictException(
        'You can only have up to 8 supersets per training component',
      );

    const component = components.find((c) => c.id === trainingComponent.id)!;
    const root = this.componentService.getRoot(component, components);
    const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

    const maxSupersetExercises =
      trainingComponent.mainSet === MainSet.BLOCK ? 4 : 32;

    const validSupersets: Superset[] = [];
    for (const superset of newSupersets) {
      if (superset.exercises.length > maxSupersetExercises)
        throw new ConflictException(
          `You can only have up to ${maxSupersetExercises} exercises per superset`,
        );

      /* // don't check exercises for warmup and cooldown
      if (
        [WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(
          trainingComponent.id,
        )
      )
        continue; */

      // validate exercises
      const validTrainingExercises: TrainingExercise[] = [];
      for (const trainingExercise of superset.exercises) {
        const exercise = exercises.find((e) => e.id === trainingExercise.id);
        if (!exercise)
          throw new NotFoundException('Training exercise not found');

        if (
          exercise.isBilateral &&
          !trainingExercise.sets.every((s) => s.paramValuesR)
        )
          throw new BadRequestException(
            `Bilateral exercise ${exercise.name} must have both left and right side sets`,
          );

        // populate training exercise params and sets
        const params = this.componentService.getComponentParamAttributes(
          componentParams,
          exercise.attributeValues,
          attributes,
        );

        const paramAttributes =
          this.componentService.getParamAttributes(params);

        const sets = this.getSets(
          exercise.isBilateral,
          paramAttributes,
          trainingExercise.sets,
        );

        const method = methods.find(
          (m) => m.id === trainingComponent.methodId,
        )!;

        if (trainingComponent.methodId && !method)
          throw new NotFoundException(
            'Method not found for training component',
          );

        if (method?.attributes?.length > 0)
          for (const set of sets) {
            this.validateMethodParamValues(method, set.paramValuesL);

            if (exercise.isBilateral && set.paramValuesR)
              this.validateMethodParamValues(method, set.paramValuesR);
          }

        validTrainingExercises.push({
          id: trainingExercise.id,
          color: trainingExercise.color,
          params: paramAttributes,
          sets,
        });

        // NOTE - currently disabled, as we can add exercises to any component
        /* const exerciseComponentLeaf = allComponents.find(
          (c) => c.id === exercise.componentIds[0],
        );

        const exerciseComponentRoot = this.componentService.getRoot(
          exerciseComponentLeaf,
          allComponents,
        );

        if (exerciseComponentRoot.id !== component.id)
          throw new BadRequestException(
            `Exercise ${exercise.name} cannot be part of selected component`,
          ); */
      }

      validSupersets.push({
        color: superset.color,
        exercises: validTrainingExercises,
      });
    }

    return validSupersets;
  }

  validateSubgroups(
    trainingComponent: UpdateTrainingComponent,
    trainingMemberIds: string[],
    data: {
      components: Component[];
      exercises: Exercise[];
      attributes: Attribute[];
      methods: Method[];
    },
  ): Subgroup[] {
    // validate all subgroups have unique members (one member cannot be in multiple subgroups)
    const trainingMemberIdsSet = new Set(trainingMemberIds);
    const membersIdsSet = new Set<string>();

    const validSubgroups: Subgroup[] = [];
    for (const subgroup of trainingComponent.subgroups) {
      // validate members
      for (const userId of subgroup.membersIds) {
        if (!trainingMemberIdsSet.has(userId))
          throw new ConflictException('Invalid member');

        if (membersIdsSet.has(userId))
          throw new ConflictException(
            'Member cannot be part of multiple subgroups simultaneously',
          );

        membersIdsSet.add(userId);
      }

      // validate supersets
      const validSupersets = this.validateSupersets(
        trainingComponent,
        subgroup.supersets,
        data,
      );

      validSubgroups.push({
        id: subgroup.id,
        name: subgroup.name,
        membersIds: subgroup.membersIds,
        supersets: validSupersets,
        mainSet: subgroup.mainSet,
      });
    }

    return validSubgroups;
  }

  getSets(
    bilateral: boolean,
    params: Attribute[],
    existingSets?: ExerciseSet[],
  ): ExerciseSet[] {
    const sets = +(
      params
        .find((p) => p.field === ParamType.VolWorkSets)
        ?.options?.find((o) => o.field === VolWorkSetType.Set)?.defaultValue ??
      1
    );

    params = params.filter((p) => p.field !== ParamType.VolWorkSets);

    if (!existingSets || !existingSets.length) {
      // generate sets with default values
      const generatedParamValues = this.attributeService.getParamValues(params);

      return Array.from({ length: sets }).map((_, i) => ({
        setNumber: i + 1,
        paramValuesL: generatedParamValues,
        ...(bilateral && { paramValuesR: generatedParamValues }),
      }));
    }

    // validate existing sets
    const validSets: ExerciseSet[] = [];
    for (const existingSet of existingSets) {
      const validParamValuesL = this.attributeService.validate(
        existingSet.paramValuesL,
        params,
      );

      if (bilateral) {
        if (!existingSet.paramValuesR)
          existingSet.paramValuesR = existingSet.paramValuesL;

        const validParamValuesR = this.attributeService.validate(
          existingSet.paramValuesR,
          params,
        );

        validSets.push({
          ...existingSet,
          paramValuesL: validParamValuesL,
          paramValuesR: validParamValuesR,
        });
      } else
        validSets.push({ ...existingSet, paramValuesL: validParamValuesL });
    }

    return validSets;
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
      from: subMinutes(startTime, DEFAULT_WARMUP_AND_COOLDOWN_DURATION),
      to: startTime,
      mainSet: MainSet.BLOCK,
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    const cooldown: TrainingComponent = {
      id: COOLDOWN_COMPONENT_ID,
      from: endTime,
      to: addMinutes(endTime, DEFAULT_WARMUP_AND_COOLDOWN_DURATION),
      mainSet: MainSet.BLOCK,
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    return { warmup, cooldown };
  }

  copyComponentIntoTraining(
    ref: ComponentRef,
    sourceTraining: Training,
    targetTraining: Training,
    options?: {
      skipSupersets?: boolean;
      skipSubgroups?: boolean;
      skipTimes?: boolean;
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
        completedMembersIds: [],
      };

    targetTrainingComponent.copiedFrom = {
      lastCopiedFromTrainingId: sourceTraining.id,
      rootCopiedFromTrainingId: sourceTrainingComponent.copiedFrom
        ? sourceTrainingComponent.copiedFrom.rootCopiedFromTrainingId
        : sourceTraining.id,
    };

    targetTrainingComponent.methodId = sourceTrainingComponent.methodId;
    targetTrainingComponent.target = sourceTrainingComponent.target;
    targetTrainingComponent.color = sourceTrainingComponent.color;
    targetTrainingComponent.completedMembersIds = []; // reset completed members
    targetTrainingComponent.mainSet = sourceTrainingComponent.mainSet;

    if (options) {
      if (!options.skipSupersets)
        targetTrainingComponent.supersets = structuredClone(
          sourceTrainingComponent.supersets,
        );

      if (!options.skipSubgroups)
        targetTrainingComponent.subgroups = structuredClone(
          sourceTrainingComponent.subgroups,
        );

      if (!options.skipTimes) {
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
  copySubgroupIntoTraining(
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

    console.log('subgroupsToCopy', subgroupsToCopy);

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

  private validateMethodParamValues(
    method: Method,
    paramValues: AttributeValue[],
  ) {
    for (const { field, value, selected } of paramValues) {
      let attribute = method.attributes.find((a) => a.field === field);
      if (!attribute) continue;

      const foundInOptions = attribute.options.find(
        (o) => o.field === selected,
      );

      if (foundInOptions) attribute = foundInOptions;

      if (!this.commonService.object.isEmpty(attribute.min))
        if (parseFloat(value) < attribute.min)
          throw new BadRequestException(
            `Value for ${field} cannot be less than ${attribute.min}`,
          );

      if (!this.commonService.object.isEmpty(attribute.max))
        if (parseFloat(value) > attribute.max)
          throw new BadRequestException(
            `Value for ${field} cannot be greater than ${attribute.max}`,
          );
    }
  }

  /**
   * Calculates average intensity and volume for a list of sets.
   * It takes into account both left and right param values.
   * If there are no sets, it returns 0 for both intensity and volume.
   */
  private getAverageIntVol(
    sets: ExerciseSet[],
  ): Pick<TrainingExerciseAverageStats, 'intensity' | 'volume'> {
    const averages = this.calculateParamTypeAverages(sets);

    const intensity = parseFloat(averages[ParamType.IntWork1].toFixed(2));
    const volume = parseFloat(averages[ParamType.VolWork1].toFixed(2));

    return { intensity, volume };
  }

  private calculateParamTypeAverages(
    sets: ExerciseSet[],
  ): Record<ParamType, number> {
    const sums: Record<ParamType, number> = {} as any;
    const counts: Record<ParamType, number> = {} as any;

    // initialize sums and counts for each ParamType
    Object.values(ParamType).forEach((param) => {
      sums[param] = 0;
      counts[param] = 0;
    });

    // iterate through sets and calculate sums and counts
    for (const set of sets) {
      for (const { field, value } of set.paramValuesL.concat(
        set.paramValuesR || [],
      )) {
        if (sums.hasOwnProperty(field)) {
          sums[field] += parseFloat(value);
          counts[field] += 1;
        }
      }
    }

    // calculate averages
    const averages: Record<ParamType, number> = {} as any;
    Object.keys(sums).forEach((field: ParamType) => {
      averages[field] = counts[field] ? sums[field] / counts[field] : 0;
    });

    // round averages to 2 decimal places
    Object.keys(averages).forEach((field: ParamType) => {
      averages[field] = parseFloat(averages[field].toFixed(2));
    });

    return averages;
  }
}
