import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes, subMinutes } from 'date-fns';
import { GLOBAL_EXERCISE_OWNER } from '../..//exercise/constant/global-exercise-owner.constant';
import { Institution } from '../..//institution/entity/institution.entity';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { AttributeService } from '../../attribute/service/attribute.service';
import { CommonService } from '../../common/service/common.service';
import { Update } from '../../common/type/entity.type';
import { User } from '../../common/type/firebase-auth.type';
import {
  TrainingComponentRef,
  UserRef,
} from '../../common/type/firestore.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { ComponentService } from '../../component/component.service';
import { DEFAULT_PARAMS_KEY } from '../../component/constant/param.constant';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { Component } from '../../component/entity/component.entity';
import { ParamType, VolWorkSetType } from '../../component/enum/param.enum';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { ExerciseAttributeValueRepository } from '../../exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { InstitutionService } from '../../institution/service/institution.service';
import { Method } from '../../method/entity/method.entity';
import {
  CompletedTrainingComponent,
  CompletedTrainingExercise,
} from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExerciseAverageStats } from '../entity/training-exercise-average-stats.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
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

  getTrainingComponents(training: Training) {
    const { warmup, cooldown, components } = training;

    // add warmup and cooldown if their reference does not exist yet
    const withWarmup = warmup
      ? [warmup, ...components.filter((c) => c !== warmup)]
      : components;

    const full = cooldown
      ? [...withWarmup.filter((c) => c !== cooldown), cooldown]
      : withWarmup;

    return full;
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
    const trainingComponents = this.getTrainingComponents(training);
    const component = this.findComponentOrFail(training, componentId);
    component.completedMembersIds.push(uid);

    // check if training is completed and update accordingly
    const completedMembersIds = training.completedMembersIds || [];
    if (this.isTrainingCompleted(training, uid))
      if (!completedMembersIds.includes(uid)) {
        completedMembersIds.push(uid); // athlete completed the training
        training.completedMembersIds = completedMembersIds;
      }

    const query: Update<Training> = {
      components: trainingComponents,
      completedMembersIds,
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
   * @param components - Components of the training
   * @param numTotalTrainingMembers - Total number of members in the group
   */
  createFutureTrainingStats(
    components: TrainingComponent[],
    numTotalTrainingMembers: number,
  ): TrainingExerciseAverageStats[] {
    const createdFutureStats = [] as {
      totalIntensity: number;
      totalVolume: number;
      totalNumMembers: number;
      exerciseId: string;
      rootComponentId: string;
    }[];

    for (const component of components) {
      const numMembersInSubgroups = component.subgroups.reduce(
        (sum, subgroup) => sum + subgroup.membersIds.length,
        0,
      );
      const numMainGroupMembers =
        numTotalTrainingMembers - numMembersInSubgroups;

      for (const superset of component.supersets) {
        for (const exercise of superset.exercises) {
          if (!exercise.sets.length) continue;

          let { avgInt, avgVol } = this.getAvgIntVolValues(exercise);

          if (!avgInt || !avgVol) continue;

          createdFutureStats.push({
            totalIntensity: avgInt * numMainGroupMembers,
            totalVolume: avgVol * numMainGroupMembers,
            totalNumMembers: numMainGroupMembers,
            exerciseId: exercise.id,
            rootComponentId: component.id,
          });
        }
      }

      for (const subgroup of component.subgroups) {
        for (const superset of subgroup.supersets) {
          for (const exercise of superset.exercises) {
            if (!exercise.sets.length) continue;

            let { avgInt, avgVol } = this.getAvgIntVolValues(exercise);

            if (!avgInt || !avgVol) continue;

            const foundFutureStat = createdFutureStats.find(
              (fs) => fs.exerciseId === exercise.id,
            );

            if (foundFutureStat) {
              foundFutureStat.totalIntensity +=
                avgInt * subgroup.membersIds.length;
              foundFutureStat.totalVolume +=
                avgVol * subgroup.membersIds.length;
              foundFutureStat.totalNumMembers += subgroup.membersIds.length;
            } else {
              createdFutureStats.push({
                totalIntensity: avgInt * subgroup.membersIds.length,
                totalVolume: avgVol * subgroup.membersIds.length,
                totalNumMembers: subgroup.membersIds.length,
                exerciseId: exercise.id,
                rootComponentId: component.id,
              });
            }
          }
        }
      }
    }

    return createdFutureStats.map((fs) => {
      const avgIntensity = fs.totalIntensity / fs.totalNumMembers;
      const avgVolume = fs.totalVolume / fs.totalNumMembers;

      return {
        exerciseId: fs.exerciseId,
        rootComponentId: fs.rootComponentId,
        numMembers: fs.totalNumMembers,
        intensity: avgIntensity,
        volume: avgVolume,
      };
    });
  }

  private getAvgIntVolValues(exercise: TrainingExercise) {
    let avgInt = 0;
    let avgVol = 0;
    for (const exerciseSet of exercise.sets) {
      const intL = exerciseSet.paramValuesL.find(
        (p) => p.field === ParamType.IntWork1,
      );
      const intR = exerciseSet.paramValuesR.find(
        (p) => p.field === ParamType.IntWork1,
      );

      const volL = exerciseSet.paramValuesL.find(
        (p) => p.field === ParamType.VolWork1,
      );
      const volR = exerciseSet.paramValuesR.find(
        (p) => p.field === ParamType.VolWork1,
      );

      if (!intL || !intR || !volL || !volR) continue;

      avgInt += (parseFloat(intL.value) + parseFloat(intR.value)) / 2;
      avgVol += (parseFloat(volL.value) + parseFloat(volR.value)) / 2;
    }

    return {
      avgInt: avgInt / exercise.sets.length,
      avgVol: avgVol / exercise.sets.length,
    };
  }

  /**
   * @param completedStats - CompletedStats of existing training in database
   * @param completedExercises - New completed exercises values from athlete
   */
  calculateTrainingStats(
    trainingComponentId: string,
    completedStats: TrainingExerciseAverageStats[],
    completedExercises: CompletedTrainingExercise[],
  ) {
    const stats: TrainingExerciseAverageStats[] = completedStats.filter(
      (s) => s.rootComponentId === trainingComponentId,
    );

    for (const completedExercise of completedExercises) {
      const trainingExerciseAverageStats: TrainingExerciseAverageStats =
        completedStats.find(
          (avg) => avg.exerciseId === completedExercise.id,
        ) || {
          exerciseId: completedExercise.id,
          rootComponentId: trainingComponentId,
          numMembers: 0,
          intensity: 0,
          volume: 0,
        };

      trainingExerciseAverageStats.intensity = this.calculateFieldAverage(
        ParamType.IntWork1,
        completedExercise.sets,
      );

      trainingExerciseAverageStats.volume = this.calculateFieldAverage(
        ParamType.VolWork1,
        completedExercise.sets,
      );

      trainingExerciseAverageStats.numMembers += 1;
      stats.push(trainingExerciseAverageStats);
    }

    return stats.map((s) => {
      s.intensity = parseFloat(s.intensity.toFixed(2));
      s.volume = parseFloat(s.volume.toFixed(2));
      return s;
    });
  }

  private calculateFieldAverage(field: ParamType, sets: ExerciseSet[]): number {
    const values = sets.flatMap((s) =>
      s.paramValuesL.concat(s.paramValuesR).filter((p) => p.field === field),
    );

    if (!values.length) return 0;

    const sum = values.reduce((acc, curr) => acc + parseFloat(curr.value), 0);
    return sum / values.length;
  }

  isTrainingCompleted(training: Training, userId: string) {
    const trainingComponents = this.getTrainingComponents(training);
    return trainingComponents.every((c) =>
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
          tExercise.sets = this.getSetData(tExercise.params);
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
            tExercise.sets = this.getSetData(tExercise.params);
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

  getSetData(
    params: Attribute[],
    paramValues?: AttributeValue[],
  ): ExerciseSet[] {
    const sets = +(
      params
        .find((p) => p.field === ParamType.VolWorkSets)
        ?.options?.find((o) => o.field === VolWorkSetType.Set)?.defaultValue ??
      1
    );

    params = params.filter((p) => p.field !== ParamType.VolWorkSets);

    const paramValuesLR = this.attributeService.getParamValues(
      params,
      paramValues,
    );

    return Array.from({ length: sets }).map((_, i) => ({
      setNumber: i + 1,
      paramValuesL: paramValuesLR,
      paramValuesR: paramValuesLR,
    }));
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
}
