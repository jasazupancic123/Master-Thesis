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

import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseAverageStats } from '../entity/training-exercise-average-stats.entity';
import { PeriodizationType } from '../enum/periodization-type.enum';

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
      components: [
        ...training.components,
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
    trainingComponents: TrainingComponent[],
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
   * Based on prescribed training, this method calculates average stats
   * for intensity and volume for each exercise in the training components
   * for all users in main group and subgroups.
   */
  calculatePrescribedTrainingStats(
    components: TrainingComponent[],
    numMembersTraining: number,
  ): TrainingExerciseAverageStats[] {
    const stats: TrainingExerciseAverageStats[] = [];

    for (const component of components) {
      const numMembersMainGroup = // all members in training - members in all subgroups
        numMembersTraining -
        component.subgroups.reduce((sum, s) => sum + s.membersIds.length, 0);
      if (numMembersMainGroup <= 0) continue; // skip if no members in main group

      for (const superset of component.supersets) {
        for (const { id, sets } of superset.exercises) {
          const { intensity, volume } = this.getAverageIntVol(sets);
          const foundStat = stats.find((s) => s.exerciseId === id);

          if (foundStat) {
            foundStat.intensity += intensity * numMembersMainGroup;
            foundStat.volume += volume * numMembersMainGroup;
            foundStat.numMembers += numMembersMainGroup;
          } else {
            stats.push({
              intensity: intensity * numMembersMainGroup,
              volume: volume * numMembersMainGroup,
              numMembers: numMembersMainGroup,
              exerciseId: id,
              rootComponentId: component.id,
            });
          }
        }
      }

      for (const subgroup of component.subgroups) {
        const numMembersSubgroup = subgroup.membersIds.length;
        if (numMembersSubgroup === 0) continue; // skip empty subgroups

        for (const superset of subgroup.supersets) {
          for (const { id, sets } of superset.exercises) {
            const { intensity, volume } = this.getAverageIntVol(sets);
            const foundMain = stats.find((s) => s.exerciseId === id);

            if (foundMain) {
              // "append" subgroup stats to main group stats to avoid duplicates
              foundMain.intensity += intensity * numMembersSubgroup;
              foundMain.volume += volume * numMembersSubgroup;
              foundMain.numMembers += numMembersSubgroup;
            } else
              // create new stats for subgroup exercise
              stats.push({
                intensity: intensity * numMembersSubgroup,
                volume: volume * numMembersSubgroup,
                numMembers: numMembersSubgroup,
                exerciseId: id,
                rootComponentId: component.id,
              });
          }
        }
      }
    }

    return stats.map((s) => {
      const intensity = s.intensity / s.numMembers; // average intensity
      const volume = s.volume / s.numMembers; // average volume
      return { ...s, intensity, volume };
    });
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
    exercises: Exercise[],
    trainingMemberIds: string[],
    trainingComponents: TrainingComponent[],
    allComponents: Component[],
    allMethods: Method[],
  ) {
    if (!trainingComponents.map((tc) => tc.id).includes(WARMUP_COMPONENT_ID))
      throw new BadRequestException('Training must have warmup component');

    if (!trainingComponents.map((tc) => tc.id).includes(COOLDOWN_COMPONENT_ID))
      throw new BadRequestException('Training must have cooldown component');

    const duplicates = new Set<string>();
    for (let i = 0; i < trainingComponents.length; i++) {
      const curr = trainingComponents[i];
      const component = allComponents.find((c) => c.id === curr.id);

      // validate components are valid
      if (!component) throw new NotFoundException('Component does not exist');
      if (component.parentId)
        throw new BadRequestException(
          `Component ${component.name} cannot be selected for training`,
        );

      // validate method
      if (curr.methodId) {
        const method = allMethods.find((m) => m.id === curr.methodId);
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
      const next = trainingComponents[i + 1];
      if (next) {
        const nextComponent = allComponents.find((c) => c.id === next.id);
        if (i < trainingComponents.length - 1 && nextComponent)
          if (curr.from >= next.from)
            throw new BadRequestException(
              `Component ${component.name} has to start before ${nextComponent.name}`,
            );
      }

      // validate supersets and subgroups
      this.validateSupersets(curr, exercises);
      this.validateSubgroups(trainingMemberIds, curr);
      this.validateTrainingExerciseValues(curr, allMethods);
    }

    if (
      trainingComponents.filter(
        (tc) => ![WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(tc.id),
      ).length > 5
    )
      throw new ConflictException(
        'You can only have up to 5 components per training',
      );
  }

  validateTrainingExerciseValues(
    trainingComponent: TrainingComponent,
    methods: Method[],
  ) {
    if (!trainingComponent.methodId) return; // no method to validate

    const method = methods.find((m) => m.id === trainingComponent.methodId);
    if (!method)
      throw new NotFoundException('Method not found for training component');

    if (!method.attributes.length) return; // no values to validate

    const exercises = trainingComponent.supersets.flatMap((s) => s.exercises);
    const sets = exercises.flatMap(
      (e: TrainingExercise | CompletedTrainingExercise) => e.sets,
    );

    for (const set of sets) {
      this.validateMethodParamValues(method, set.paramValuesL);
      this.validateMethodParamValues(method, set.paramValuesR);
    }
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
    trainingComponents: TrainingComponent[],
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
          tExercise.sets = this.getSets(tExercise.params, tExercise.sets);
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
            tExercise.sets = this.getSets(tExercise.params, tExercise.sets);
          }
    }
  }

  validateSupersets(component: TrainingComponent, exercises: Exercise[]) {
    if (component.supersets.length > 8)
      throw new ConflictException(
        'You can only have up to 8 supersets per training component',
      );

    const supersets = [
      ...component.supersets,
      ...component.subgroups.flatMap((s) => s.supersets),
    ];

    for (const superset of supersets) {
      if (superset.exercises.length > 4)
        throw new ConflictException(
          'You can only have up to 4 exercises per superset',
        );

      // don't check exercises for warmup and cooldown
      if ([WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(component.id))
        continue;

      // validate exercises
      for (const trainingExercise of superset.exercises) {
        const exercise = exercises.find((e) => e.id === trainingExercise.id);
        if (!exercise)
          throw new NotFoundException('Training exercise not found');

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
    }
  }

  validateSubgroups(trainingMemberIds: string[], component: TrainingComponent) {
    // validate all subgroups have unique members (one member cannot be in multiple subgroups)
    const trainingMemberIdsSet = new Set(trainingMemberIds);
    const membersIdsSet = new Set<string>();

    for (const subgroup of component.subgroups)
      for (const userId of subgroup.membersIds) {
        if (!trainingMemberIdsSet.has(userId))
          throw new ConflictException('Invalid member');

        if (membersIdsSet.has(userId))
          throw new ConflictException(
            'Member cannot be part of multiple subgroups simultaneously',
          );

        membersIdsSet.add(userId);
      }
  }

  getSets(params: Attribute[], existingSets?: ExerciseSet[]): ExerciseSet[] {
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
        paramValuesR: generatedParamValues,
      }));
    }

    // validate existing sets
    const validSets: ExerciseSet[] = [];
    for (const existingSet of existingSets) {
      const validParamValuesL = this.attributeService.validate(
        existingSet.paramValuesL,
        params,
      );

      const validParamValuesR = this.attributeService.validate(
        existingSet.paramValuesR,
        params,
      );

      validSets.push({
        ...existingSet,
        paramValuesL: validParamValuesL,
        paramValuesR: validParamValuesR,
      });
    }

    return validSets;
  }

  createWarmupAndCooldown(
    from: Date,
    to: Date,
    components: TrainingComponent[],
  ): { warmup: TrainingComponent; cooldown: TrainingComponent } {
    let cooldownFrom = to;
    if (components.length) {
      cooldownFrom = components
        .map((c) => c.to)
        .sort((a: Date, b: Date) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];
    }

    const warmup: TrainingComponent = {
      id: WARMUP_COMPONENT_ID,
      from: subMinutes(from, 5),
      to: from,
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    const cooldown: TrainingComponent = {
      id: COOLDOWN_COMPONENT_ID,
      from: cooldownFrom,
      to: addMinutes(cooldownFrom, 5),
      supersets: [],
      subgroups: [],
      completedMembersIds: [],
    };

    return { warmup, cooldown };
  }

  updateWarmupAndCooldownTimes(
    warmup: TrainingComponent,
    cooldown: TrainingComponent,
    trainingComponents: TrainingComponent[],
  ): void {
    let cooldownFrom = trainingComponents[trainingComponents.length - 1].to;
    if (trainingComponents.length)
      cooldownFrom = trainingComponents
        .map((c) => c.to)
        .sort((a: Date, b: Date) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];

    warmup.from = subMinutes(trainingComponents[0].from, 5);
    warmup.to = trainingComponents[0].from;
    cooldown.from = cooldownFrom;
    cooldown.to = addMinutes(cooldownFrom, 5);
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
        set.paramValuesR,
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
