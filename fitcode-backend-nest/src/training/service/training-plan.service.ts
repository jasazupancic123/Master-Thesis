import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes, subMinutes } from 'date-fns';
import { Update } from '../../common/type/entity.type';
import { TrainingComponentRef } from '../../common/type/firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { Component } from '../../component/entity/component.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { Wrapper } from '../../common/type/wrapper.type';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { ComponentService } from '../../component/component.service';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
} from '../../component/constant/param.constant';
import { ComponentParam } from '../../component/entity/component-param.entity';
import { ExerciseAttributeValue } from '../../exercise/entity/exercise-attribute-value.entity';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { ParamType, VolWorkSetType } from '../../component/enum/param.enum';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { AttributeService } from '../../attribute/service/attribute.service';
import { ExerciseAttributeValueRepository } from '../../exercise/repository/exercise-attribute-value.repository';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { Method } from '../../method/entity/method.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { WorkloadService } from './workload.service';
import { GroupWorkloadStats } from '../entity/average-workload-values.entity';
import { PeriodizationType } from '../../group/enum/periodization-type.enum';
import { CommonService } from '../../common/service/common.service';
import { User } from '../../common/type/firebase-auth.type';
import { InstitutionService } from '../../institution/service/institution.service';
import { GLOBAL_EXERCISE_OWNER } from '../..//exercise/constant/global-exercise-owner.constant';
import { Institution } from '../..//institution/entity/institution.entity';

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
    return [training.warmup, ...training.components, training.cooldown];
  }

  getAddComponentsQuery(
    training: Training,
    input: Update<TrainingComponent>[],
  ): [Partial<Training>, Training] {
    const lastComponent = training.components[training.components.length - 1];

    const query: Partial<Training> = {
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
  ): [Partial<Training>, Training] {
    const updatedComponents = training.components.filter(
      (c) => c.id !== ref.componentId,
    );

    const query = {
      components: updatedComponents,
    };

    training.components = updatedComponents;
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
    const foundComponent = training.components.find(
      (c) => c.id === componentId,
    );

    if (!foundComponent)
      throw new NotFoundException(`Component with id ${componentId} not found`);

    return foundComponent;
  }

  /**
   * @param futureStats - FutureStats of existing training in database
   * @param exercises - New completed exercises values from athlete
   */
  calculateFutureTrainingStats(
    futureStats: GroupWorkloadStats[],
    exercises: TrainingExercise[],
  ) {
    for (const exercise of exercises) {
      const avgFutureStats = futureStats.find(
        (avg) => avg.exerciseId === exercise.id,
      );

      if (!avgFutureStats) continue;

      const intensitiesL = exercise.sets
        .flatMap((set) => set.paramValuesL)
        .filter((p) => p.field === ParamType.IntWork1);
      const intensitiesR = exercise.sets
        .flatMap((set) => set.paramValuesR)
        .filter((p) => p.field === ParamType.IntWork1);

      const avgIntensity =
        (intensitiesL.reduce((sum, p) => sum + parseFloat(p.value), 0) /
          intensitiesL.length +
          intensitiesR.reduce((sum, p) => sum + parseFloat(p.value), 0) /
            intensitiesR.length) /
        2;

      const volumesL = exercise.sets
        .flatMap((set) => set.paramValuesL)
        .filter((p) => p.field === ParamType.VolWork1);
      const volumesR = exercise.sets
        .flatMap((set) => set.paramValuesR)
        .filter((p) => p.field === ParamType.VolWork1);

      const avgVolume =
        (volumesL.reduce((sum, p) => sum + parseFloat(p.value), 0) /
          volumesL.length +
          volumesR.reduce((sum, p) => sum + parseFloat(p.value), 0) /
            volumesR.length) /
        2;

      avgFutureStats.intensity = avgIntensity;
      avgFutureStats.volume = avgVolume;
    }

    return futureStats;
  }

  isTrainingCompleted(userId: string, trainingComponents: TrainingComponent[]) {
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

    if (!method.attributeRanges.length) return; // no values to validate

    const exercises = trainingComponent.supersets.flatMap((s) => s.exercises);

    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        this.validateParamValues(method, set.paramValuesL);
        this.validateParamValues(method, set.paramValuesR);
      }
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

  private validateParamValues(method: Method, paramValues: AttributeValue[]) {
    for (const paramValue of paramValues) {
      let attributeRange = method.attributeRanges.find(
        (ar) => ar.field === paramValue.field,
      );
      if (!attributeRange) continue;

      const foundInOptions = attributeRange.options.find(
        (o) => o.field === paramValue.selected,
      );
      if (foundInOptions) attributeRange = foundInOptions;

      if (attributeRange.min !== undefined) {
        if (parseFloat(paramValue.value) < attributeRange.min) {
          throw new BadRequestException(
            `Value for ${paramValue.field} cannot be less than ${attributeRange.min}`,
          );
        }
      }
      if (attributeRange.max !== undefined) {
        if (parseFloat(paramValue.value) > attributeRange.max) {
          throw new BadRequestException(
            `Value for ${paramValue.field} cannot be greater than ${attributeRange.max}`,
          );
        }
      }
    }
  }

  populateTrainingExerciseParams(
    trainingComponents: TrainingComponent[],
    components: Component[],
    exercises: Exercise[], // populate exercise attributes
    attributes: Attribute[],
  ) {
    for (const tComponent of trainingComponents) {
      const component = components.find((c) => c.id === tComponent.id)!;
      const root = this.componentService.getRoot(component, components);
      const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

      for (const s of tComponent.supersets)
        for (const tExercise of s.exercises) {
          if (tExercise.params.length > 0 || tExercise.sets.length > 0)
            continue; // already populated

          const exercise = exercises.find((e) => e.id === tExercise.id)!;
          if (!exercise) continue;

          const params = this.getComponentParamAttributes(
            componentParams,
            exercise.attributeValues,
            attributes,
          );

          tExercise.params = this.getParamAttributes(params);
          tExercise.sets = this.getSetData(tExercise.params);
        }

      for (const subgroup of tComponent.subgroups)
        for (const s of subgroup.supersets)
          for (const tExercise of s.exercises) {
            if (tExercise.params.length > 0 || tExercise.sets.length > 0)
              continue; // already populated

            const exercise = exercises.find((e) => e.id === tExercise.id)!;
            if (!exercise) continue;

            const params = this.getComponentParamAttributes(
              componentParams,
              exercise.attributeValues,
              attributes,
            );

            tExercise.params = this.getParamAttributes(params);
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

    const paramValuesLR = this.getTrainingExerciseParamValues(
      params,
      paramValues,
    );

    return Array.from({ length: sets }).map((_, i) => ({
      setNumber: i + 1,
      paramValuesL: paramValuesLR,
      paramValuesR: paramValuesLR,
    }));
  }

  getParamAttributes(componentParams: ComponentParam[]) {
    const selectedAttributes: Attribute[] = [];
    for (const param of componentParams) {
      const attribute = PARAMS.find((a) => a.field === param.field);
      if (!attribute) continue;

      const options: Attribute[] = [];
      if (attribute.options?.length > 0) {
        // if hardcoded param has options, but component param does not, select all options by default
        const paramOptions = param.options ? param.options : attribute.options;
        options.push(
          ...this.mapOptionsRecursively(paramOptions, attribute.options),
        );
      }

      selectedAttributes.push({
        ...attribute,
        options,
        defaultValue: param.defaultValue || attribute.defaultValue,
      });
    }

    return selectedAttributes;
  }

  getComponentParamAttributes(
    params: { [condition: string]: ComponentParam[] },
    attributeValues: ExerciseAttributeValue[],
    attributes: Attribute[],
  ): ComponentParam[] {
    let componentParams: ComponentParam[] = params[DEFAULT_PARAMS_KEY] || [];

    for (const condition of Object.keys(params)) {
      if (condition === DEFAULT_PARAMS_KEY) continue;
      const [field, operator, value] = condition.split(':'); // e.g. "field:eq:value"

      const attrVal = attributeValues.find((a) => a.field === field);
      const attribute = attributes.find((a) => a.field === field)!;

      if (attribute && !attrVal && operator === '!') {
        // case for empty value and operator ! (value does not exist)
        componentParams = params[condition];
        continue;
      }

      if (!attribute || !attrVal) continue;

      switch (operator) {
        case 'eq': // equality check
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) === parseFloat(value)
          )
            // number
            componentParams = params[condition];
          else if (attrVal.value === value)
            // string
            componentParams = params[condition];

          break;
        case 'like': // string inclusion
          if (
            attribute.type === AttributeType.String &&
            attrVal.value.includes(value)
          )
            // string
            componentParams = params[condition];

          break;
        case 'gt': // greater than
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) > parseFloat(value)
          )
            // number
            componentParams = params[condition];

          break;
        case 'lt': // less than
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) < parseFloat(value)
          )
            // number
            componentParams = params[condition];

          break;
        case 'gte': // greater than or equal
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) >= parseFloat(value)
          )
            // number
            componentParams = params[condition];

          break;
        case 'lte': // Less than or equal
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) <= parseFloat(value)
          )
            // number
            componentParams = params[condition];

          break;
        case 'range': // range check
          if (attribute.type === AttributeType.Number) {
            // number
            const [min, max] = value.split('-').map(parseFloat);
            const numericValue = parseFloat(attrVal.value);
            if (numericValue >= min && numericValue <= max)
              componentParams = params[condition];
          }

          break;
        case '!': // boolean false value
          if (
            attribute.type === AttributeType.Boolean &&
            attrVal.value === 'false'
          )
            // boolean
            componentParams = params[condition];

          break;
        // default case for boolean or no operator (just check if the field exists)
        default:
          if (
            (attribute.type === AttributeType.Boolean ||
              attribute.type === AttributeType.Value) &&
            (attrVal.value === 'true' || !attrVal.value)
          )
            componentParams = params[condition];
      }
    }

    return componentParams;
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

  /**
   * Populates param values data for training exercise. If no param values are provided, it
   * takes default values from params.
   *
   * @example
   * ```ts
   * const params = [
   *  {
   *     field: 'field',
   *     type: 'select',
   *     defaultValue: 'opt-2',
   *     options: [
   *       {
   *         field: 'opt-1',
   *         type: 'value',
   *         defaultValue: 'opt-1',
   *       },
   *       {
   *         field: 'opt-2',
   *         type: 'value',
   *         defaultValue: 'opt-2',
   *       },
   *     ]
   *   },
   *   {
   *     field: 'str',
   *     type: 'string',
   *     defaultValue: 'example',
   *   }
   * ]
   *
   * const paramValues = [
   *   {
   *     field: 'str',
   *     selected: 'str',
   *     value: 'test'
   *   }
   * ]
   *
   * const values = getTrainingExerciseParamValues(params, paramValues)
   * => [
   *   {
   *     field: 'field',
   *     selected: 'opt-2',
   *     value: 'opt-2'
   *   },
   *   {
   *     field: 'str',
   *     selected: 'str',
   *     value: 'test'
   *   },
   * ]
   * ```
   */
  private getTrainingExerciseParamValues(
    params: Attribute[],
    paramValues?: AttributeValue[],
  ) {
    const values: AttributeValue[] = [];

    for (const param of params) {
      const { selected, value } = this.populateDefaultSelectedValue(param);
      const providedParamValue = paramValues?.find(
        (v) => v.field === param.field,
      );

      values.push(
        providedParamValue
          ? providedParamValue
          : { field: param.field, selected, value },
      );
    }

    return this.attributeService.validate(values, params);
  }

  /**
   * `ComponentParam` is a partial attribute, which enables
   * selecting different sub-parameters for different exercises
   * from hardcoded parameters. For example, hardcoded volumen
   * options are rep, time and distance, and by using `ComponentParam`,
   * we can choose only a subset of those options, and this applies
   * for nested options also.
   */
  private mapOptionsRecursively(
    paramOptions: ComponentParam[],
    attributeOptions: Attribute[],
  ): Attribute[] {
    if (!paramOptions) return [];
    const mappedOptions: Attribute[] = [];

    for (const paramOption of paramOptions) {
      const attributeOption = attributeOptions.find(
        (o) => o.field === paramOption.field,
      );

      if (!attributeOption) continue;

      // recursively map nested options
      const nestedOptions: Attribute[] = [];
      if (attributeOption.options?.length > 0) {
        nestedOptions.push(
          ...this.mapOptionsRecursively(
            paramOption.options || attributeOption.options,
            attributeOption.options,
          ),
        );
      }

      mappedOptions.push({
        ...attributeOption,
        options: nestedOptions,
        defaultValue: paramOption.defaultValue || attributeOption.defaultValue,
      });
    }

    return mappedOptions;
  }

  /**
   * Populates default selected value and attribute value based on whether defaultValue
   * is provided, else it selects the first possible option in options array.
   *
   * @example
   * ```ts
   * const param = {
   *   field: 'field',
   *   type: 'select',
   *   defaultValue: 'opt-2',
   *   options: [
   *     {
   *       field: 'opt-1',
   *       type: 'value',
   *       defaultValue: 'opt-1',
   *     },
   *     {
   *       field: 'opt-2',
   *       type: 'value',
   *       defaultValue: 'opt-2',
   *     },
   *   ]
   * }
   *
   * const result = populateDefaultSelectedAndValue(param)
   * => {
   *   field: 'field',
   *   selected: 'opt-2',
   *   value: 'opt-2'
   * }
   * ```
   *
   * @example
   * ```ts
   * const param = {
   *   field: 'field',
   *   type: 'select',
   *   options: [
   *     {
   *       field: 'opt-1',
   *       type: 'value',
   *     },
   *     {
   *       field: 'opt-2',
   *       type: 'value',
   *     },
   *   ]
   * }
   *
   * const result = populateDefaultSelectedAndValue(param)
   * => {
   *   field: 'field',
   *   selected: 'opt-1',
   *   value: 'opt-1'
   * }
   * ```
   */
  private populateDefaultSelectedValue(param: Attribute): {
    selected: string;
    value: string;
  } {
    if (
      param.type !== AttributeType.Select &&
      param.type !== AttributeType.Multiselect
    ) {
      return {
        selected: '',
        value: param.defaultValue || '',
      };
    }

    let selectedPath = '';
    let currentOptions = param.options || [];
    let currentAttribute = param;
    let value = '';

    while (currentOptions && currentOptions.length > 0) {
      let selectedOption: Attribute;

      if (currentAttribute.defaultValue) {
        selectedOption =
          currentOptions.find(
            (opt) => opt.field === currentAttribute.defaultValue,
          ) || currentOptions[0];
      } else selectedOption = currentOptions[0];

      selectedPath = selectedPath
        ? `${selectedPath}:${selectedOption.field}`
        : selectedOption.field;

      if (!selectedOption.options || selectedOption.options.length === 0) {
        value = selectedOption.defaultValue || '';
        break;
      }

      currentAttribute = selectedOption;
      currentOptions = selectedOption.options;
    }

    return {
      selected: selectedPath,
      value: value,
    };
  }
}
