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
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { Method } from '@src/method/entity/method.entity';

import { MAIN_GROUP_PARENT_ID } from '../constant/main-group-parent-id.constant';
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
      completedMembersIds: training.completedMembersIds.filter(
        (uid) => uid === athleteId,
      ),
    };
  }

  hasParamType(
    training: Training,
    filter: { field: ParamType; selected: IntType | VolType },
  ): boolean {
    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises)
          for (const set of exercise.sets)
            if (
              set.paramValuesL.find((pv) => this.matchesParamType(pv, filter))
            )
              return true;

    return false;
  }

  modifyPrescribedParamValuesByType(
    training: Training,
    filter: { field: ParamType; selected: IntType | VolType },
    modify: (value: number, exerciseId?: string) => number,
  ) {
    for (const component of training.components) {
      for (const superset of component.supersets)
        this.modifySupersetValuesByParamType(superset, filter, modify);

      for (const subgroup of component.subgroups)
        for (const superset of subgroup.supersets)
          this.modifySupersetValuesByParamType(superset, filter, modify);
    }
  }

  findExercisesByParamType(
    training: Training,
    filter: { field: ParamType; selected: IntType | VolType },
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];

    for (const component of training.components)
      for (const superset of component.supersets)
        for (const exercise of superset.exercises) {
          if (exercises.find((e) => e.id === exercise.id)) continue;

          for (const set of exercise.sets)
            if (
              set.paramValuesL.find((pv) => this.matchesParamType(pv, filter))
            ) {
              exercises.push(exercise);
              break;
            }
        }

    return exercises;
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
      const supersets = this.validateSupersets(curr, curr, data);
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
    item: { supersets: UpdateSuperset[]; mainSet: MainSet },
    data: {
      components: Component[];
      exercises: Exercise[];
      attributes: Attribute[];
      methods: Method[];
    },
  ): Superset[] {
    const newSupersets = item.supersets || [];
    const mainSet = item.mainSet || trainingComponent.mainSet;
    const { components, exercises, attributes, methods } = data;

    switch (mainSet) {
      case MainSet.BLOCK:
        if (newSupersets.length > 8)
          throw new ConflictException(
            'You can only have up to 8 supersets per training component for block sets',
          );
        break;
      case MainSet.CIRCUIT:
        if (newSupersets.length > 1)
          throw new ConflictException('You can only have one circuit set');
    }

    const component = components.find((c) => c.id === trainingComponent.id)!;
    const root = this.componentService.getRoot(component, components);
    const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

    const validSupersets: Superset[] = [];
    for (const superset of newSupersets) {
      // validate max exercises per superset
      switch (mainSet) {
        case MainSet.BLOCK:
          if (superset.exercises.length > 4)
            throw new ConflictException(
              'You can only have up to 4 exercises per superset for block sets',
            );
          break;
        case MainSet.CIRCUIT:
          if (superset.exercises.length > 16)
            throw new ConflictException(
              'You can only have up to 16 exercises per superset for circuit sets',
            );
      }

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
    targetTrainingComponent.mainSet = sourceTrainingComponent.mainSet;
    targetTrainingComponent.completedMembersIds = []; // reset completed members

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

  private modifySupersetValuesByParamType(
    superset: Superset,
    filter: { field: ParamType; selected: IntType | VolType },
    modify: (value: number, exerciseId?: string) => number,
  ) {
    for (const exercise of superset.exercises)
      for (const set of exercise.sets) {
        for (const pv of set.paramValuesL)
          if (this.matchesParamType(pv, filter))
            pv.value = modify(parseFloat(pv.value), exercise.id).toString();

        if (set.paramValuesR)
          for (const pv of set.paramValuesR)
            if (this.matchesParamType(pv, filter))
              pv.value = modify(parseFloat(pv.value), exercise.id).toString();
      }
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

  private matchesParamType(
    paramValue: AttributeValue,
    filter: { field: ParamType; selected: IntType | VolType },
  ): boolean {
    return (
      paramValue.field === filter.field &&
      paramValue.selected === filter.selected
    );
  }
}
