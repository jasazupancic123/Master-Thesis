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
import { TrainingComponentRef } from '@src/common/type/firestore.type';
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
import { PeriodizationType } from '../enum/periodization-type.enum';
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
          target: c.target,
          periodizationType: c.periodizationType,
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

  /**
   * Generates weeks between first and last training and fills in all
   * of the trainings. For example, we have 3 trainings, 2 in first
   * week and one in the second week. Returns array of 2 elements,
   * first containing the first 2 trainings and the second containing
   * the last training.
   *
   * @example
   * ```ts
   * const trainings = [
   *  { from: '2025-10-01' },
   *  { from: '2025-14-01' },
   *  { from: '2025-21-01' },
   * ]
   *
   * const firstTraining = trainings[0];
   * const lastTraining = trainings[trainings.length - 1];
   *
   * const result = getSpacedTrainingsByWeek(
   *  firstTraining,
   *  lastTraining,
   *  trainings,
   * ); // => [
   * // [
   * //  { from: '2025-10-01' },
   * //  { from: '2025-14-01' },
   * // ],
   * // [
   * //  { from: '2025-21-01' },
   * // ]
   * //]
   * ```
   */
  getSpacedTrainingsByWeek(
    firstTraining: Training,
    lastTraining: Training,
    trainings: Training[],
  ): Training[][] {
    const startWeek = this.commonService.date.getIsoWeek(firstTraining.from);
    const lastWeek = this.commonService.date.getIsoWeek(lastTraining.from);
    const numWeeks = lastWeek - startWeek + 1;
    const weeks = Array.from({ length: numWeeks }, () => [] as Training[]);

    // fill the trainings in weeks
    for (const training of trainings) {
      const weekIndex =
        this.commonService.date.getIsoWeek(training.from) - startWeek;

      if (weekIndex >= 0 && weekIndex < weeks.length)
        weeks[weekIndex].push(training);
    }

    // sort trainings in week by date
    for (const week of weeks)
      week.sort((a, b) => a.from.getTime() - b.from.getTime());

    const numTrainingInWeeks = weeks.flat().length;
    if (trainings.length !== numTrainingInWeeks)
      throw new BadRequestException('Some trainings are missing or not found');

    return weeks;
  }

  checkPeriodizationType(type: PeriodizationType) {
    if (type === PeriodizationType.DUP_TABLE_BASED)
      throw new BadRequestException(
        'Dup Table Based periodization is not supported yet',
      );
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

    const validSupersets: Superset[] = [];
    for (const superset of newSupersets) {
      if (superset.exercises.length > 4)
        throw new ConflictException(
          'You can only have up to 4 exercises per superset',
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
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    const cooldown: TrainingComponent = {
      id: COOLDOWN_COMPONENT_ID,
      from: endTime,
      to: addMinutes(endTime, DEFAULT_WARMUP_AND_COOLDOWN_DURATION),
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    return { warmup, cooldown };
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
