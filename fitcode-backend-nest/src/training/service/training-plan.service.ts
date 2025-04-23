import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { Update } from '../../common/type/entity.type';
import { TrainingComponentRef } from '../../common/type/firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { Component } from '../../component/entity/component.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { Wrapper } from '../../common/type/wrapper.type';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { User } from '../../common/type/firebase-auth.type';
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
import {
  IntType,
  ParamType,
  VolWorkSetType,
} from '../../component/enum/param.enum';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { AttributeService } from '../../attribute/service/attribute.service';
import { ExerciseAttributeValueRepository } from '../../exercise/repository/exercise-attribute-value.repository';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly attributeService: AttributeService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
    @Inject(forwardRef(() => ExerciseAttributeValueRepository))
    private readonly exerciseAttributeValueRepository: Wrapper<ExerciseAttributeValueRepository>,
  ) {}

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
          subgroups: [],
          supersets: [{ exercises: [] }],
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

  async findAllTrainingExercises(
    user: User,
    trainingComponents: TrainingComponent[],
  ): Promise<Exercise[]> {
    const trainingExercises = trainingComponents.flatMap((c) => [
      ...c.supersets.flatMap((s) => s.exercises),
      ...c.subgroups.flatMap((s) => s.supersets.flatMap((s) => s.exercises)),
    ]);

    const ids = [...new Set(trainingExercises.map((e) => e.id))];
    const exercises =
      ids.length > 0 ? await this.exerciseService.findAllByIds(user, ids) : [];

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

  validateTrainingComponents(
    exercises: Exercise[],
    trainingMemberIds: string[],
    trainingComponents: TrainingComponent[],
    allComponents: Component[],
  ) {
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
        if (i < trainingComponents.length - 1)
          if (curr.from >= next.from)
            throw new BadRequestException(
              `Component ${component.name} has to start before ${nextComponent.name}`,
            );
      }

      // validate supersets and subgroups
      this.validateSupersets(curr, exercises);
      this.validateSubgroups(trainingMemberIds, curr, exercises);

      // validate exercises
      const leafs = this.componentService.leafsFromFlat(allComponents);

      if (
        exercises.length > 0 &&
        exercises.every((e) =>
          e.componentIds.some(() =>
            leafs.some((leaf) => leaf.parents?.includes(component.id)),
          ),
        )
      )
        this.exerciseService.validateExercises(component.id, exercises, leafs);
    }

    if (trainingComponents.length > 5)
      throw new ConflictException(
        'You can only have up to 5 components per training',
      );
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

    for (const superset of component.supersets) {
      if (superset.exercises.length > 4)
        throw new ConflictException(
          'You can only have up to 4 exercises per superset',
        );

      for (const exercise of superset.exercises) {
        const trainingExercise = exercises.find((e) => e.id === exercise.id);
        if (!trainingExercise)
          throw new NotFoundException('Training exercise not found');
      }
    }
  }

  validateSubgroups(
    trainingMemberIds: string[],
    component: TrainingComponent,
    exercises: Exercise[],
  ) {
    // validate all subgroups have unique members (one member cannot be in multiple subgroups)
    const trainingMemberIdsSet = new Set(trainingMemberIds);
    const membersIdsSet = new Set<string>();

    for (const subgroup of component.subgroups) {
      for (const userId of subgroup.membersIds) {
        if (!trainingMemberIdsSet.has(userId) || membersIdsSet.has(userId))
          throw new ConflictException(
            `Member ${userId} cannot be in multiple subgroups in the same training component`,
          );

        membersIdsSet.add(userId);
      }

      this.validateSupersets(component, exercises);
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

    return Array.from({ length: sets }).map((_, i) => ({
      setNumber: i + 1,
      paramValues: this.getTrainingExerciseParamValues(params, paramValues),
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
            attribute.type === AttributeType.Boolean &&
            attrVal.value === 'true'
          )
            componentParams = params[condition];
      }
    }

    return componentParams;
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
