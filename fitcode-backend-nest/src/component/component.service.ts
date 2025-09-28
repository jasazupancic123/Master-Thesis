import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { Attribute } from '../attribute/entity/attribute.entity';
import { AttributeValue } from '../attribute/entity/attribute-value.entity';
import { CacheManagerService } from '../cache-manager/cache-manager.service';
import { LogMethod } from '../common/decorator/log-method.decorator';
import { AttributeType } from '../common/enum/attribute-type.enum';
import { CommonService } from '../common/service/common.service';
import { Create, Update } from '../common/type/entity.type';
import { CACHE_KEY_FLAT_COMPONENTS } from './constant/cache.constant';
import { DEFAULT_PARAMS_KEY, PARAMS } from './constant/param.constant';
import {
  COOLDOWN_COMPONENT,
  WARMUP_COMPONENT,
} from './constant/warmup-cooldown.constant';
import { Component } from './entity/component.entity';
import { ComponentParam } from './entity/component-param.entity';
import { ComponentRepository } from './repository/component.repository';

@Injectable()
export class ComponentService {
  private logger = new Logger(ComponentService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly componentRepository: ComponentRepository,
  ) {}

  @LogMethod()
  async create(data: Create<Component>): Promise<Component> {
    const componentSlug = await this.componentRepository.save(data);

    // TODO - if newly created component is leaf node, move all parent exercises to "Other" component

    await this.cacheManagerService.del(CACHE_KEY_FLAT_COMPONENTS);
    return await this.componentRepository.findById(componentSlug);
  }

  async createFromTree(
    data: Omit<Component, 'children' | 'parents'> & {
      children: Component[];
    },
  ): Promise<Component> {
    const component = await this.create({
      id: data.id,
      parentId: data.parentId,
      name: data.name,
      slug: data.slug,
      targets: data.targets,
      attributes: data.attributes,
      params: data.params,
    });

    await this.cacheManagerService.del(CACHE_KEY_FLAT_COMPONENTS);

    const children = data.children || [];
    for (const child of children) {
      const childData = {
        ...child,
        parentId: component.id,
        children: child.children as unknown as Component[],
      };

      await this.createFromTree(childData);
    }

    return component;
  }

  async findOneBySlug(slug: string): Promise<Component> {
    return await this.componentRepository.findById(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Component> {
    const component = await this.componentRepository.findById(slug);
    if (!component) throw new BadRequestException('Component not found');
    return component;
  }

  async findAllFlat(excludeHardcoded = false): Promise<Component[]> {
    let components = await this.cacheManagerService.get<Component[]>(
      CACHE_KEY_FLAT_COMPONENTS,
    );

    if (!components) components = await this.componentRepository.findAll();
    if (!excludeHardcoded)
      components.push(WARMUP_COMPONENT, COOLDOWN_COMPONENT);

    for (const component of components) this.populate(component, components);
    return components;
  }

  async findAllTree(/* filter?: Filter<Component> */): Promise<Component[]> {
    const components = await this.findAllFlat();
    return this.commonService.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });
  }

  leafsFromFlat(components: Component[]): Component[] {
    return components.filter((c) => !c.children.length);
  }

  /**
   * Finds leaf component by slug
   * @param slug - component slug
   * @param components - leaf components
   */
  getLeafBySlug(slug: string, components: Component[]): Component | null {
    return components.find((c) => c.slug === slug) || null;
  }

  /**
   * Finds root of component by traversing parents tree.
   * @param component - component to find the root of
   * @param components - components populated with `parents` array
   */
  getRoot(component: Component, components: Component[]): Component | null {
    if (component.parents?.length === 0) return component;

    for (const parentId of component.parents) {
      const parent = components.find((c) => c.id === parentId);
      if (parent?.parents?.length === 0) return parent;
    }

    return null;
  }

  /**
   * Allows component's name and slug to be updated.
   */
  async update(
    id: string,
    data: Update<Component, 'name' | 'parentId' | 'slug'>,
  ): Promise<Component> {
    this.logger.debug(
      `Updating component #${id} with data ${JSON.stringify(data)}`,
    );

    const component = await this.componentRepository.findById(id);
    if (!component) throw new BadRequestException('Component not found');

    await this.componentRepository.update(id, data);
    await this.cacheManagerService.del(CACHE_KEY_FLAT_COMPONENTS);

    return component;
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
        ...(options.length > 0 ? { options } : {}),
        defaultValue: (param.defaultValue as string) || attribute.defaultValue,
      });
    }

    return selectedAttributes;
  }

  getComponentParamAttributes(
    params: { [condition: string]: ComponentParam[] },
    attributeValues: AttributeValue[],
    attributes: Attribute[],
  ): ComponentParam[] {
    const componentParams: ComponentParam[] = params[DEFAULT_PARAMS_KEY] || [];

    for (const condition of Object.keys(params)) {
      if (condition === DEFAULT_PARAMS_KEY) continue;

      const [field, operator, value] = condition.split(':'); // e.g. "field:eq:value"
      const attrVal = attributeValues.find((a) => a.field === field);
      const attribute = attributes.find((a) => a.field === field)!;

      if (attribute && !attrVal && operator === '!')
        // case for empty value and operator ! (value does not exist)
        return params[condition];

      if (!attribute || !attrVal) continue;

      switch (operator) {
        case 'eq': // equality check
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) === parseFloat(value)
          )
            // number
            return params[condition];
          else if (attrVal.value === value)
            // string
            return params[condition];

          break;
        case 'like': // string inclusion
          if (
            attribute.type === AttributeType.String &&
            attrVal.value.includes(value)
          )
            // string
            return params[condition];

          break;
        case 'gt': // greater than
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) > parseFloat(value)
          )
            // number
            return params[condition];

          break;
        case 'lt': // less than
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) < parseFloat(value)
          )
            // number
            return params[condition];

          break;
        case 'gte': // greater than or equal
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) >= parseFloat(value)
          )
            // number
            return params[condition];

          break;
        case 'lte': // Less than or equal
          if (
            attribute.type === AttributeType.Number &&
            parseFloat(attrVal.value) <= parseFloat(value)
          )
            // number
            return params[condition];

          break;
        case 'range': // range check
          if (attribute.type === AttributeType.Number) {
            // number
            const [min, max] = value.split('-').map(parseFloat);
            const numericValue = parseFloat(attrVal.value);
            if (numericValue >= min && numericValue <= max)
              return params[condition];
          }

          break;
        case 'selected': // select attribute
          if (attribute.type !== AttributeType.Select)
            throw new BadRequestException(
              'Operator "selected" can only be used with select attribute types',
            );

          // single select with only values as options
          const option = (attribute.options || []).find(
            (o) => o.field === attrVal.value,
          );

          if (
            option &&
            option.type === AttributeType.Value &&
            value === attrVal.value
          )
            return params[condition];
        case '!': // boolean false value
          if (
            attribute.type === AttributeType.Boolean &&
            attrVal.value === 'false'
          )
            // boolean
            return params[condition];

          break;
        // default case for boolean or no operator (just check if the field exists)
        default:
          if (
            (attribute.type === AttributeType.Boolean ||
              attribute.type === AttributeType.Value) &&
            (attrVal.value === 'true' || !attrVal.value)
          )
            return params[condition];
      }
    }

    return componentParams;
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
      if (
        (attributeOption.type === AttributeType.Select ||
          attributeOption.type === AttributeType.Multiselect) &&
        attributeOption.options?.length > 0
      ) {
        nestedOptions.push(
          ...this.mapOptionsRecursively(
            paramOption.options || attributeOption.options,
            attributeOption.options,
          ),
        );
      }

      mappedOptions.push({
        ...attributeOption,
        ...(nestedOptions.length > 0 ? { options: nestedOptions } : {}),
        defaultValue:
          (paramOption.defaultValue as string) ||
          (attributeOption.defaultValue as string),
      });
    }

    return mappedOptions;
  }

  private populate(
    component: Component,
    components: Component[], // flat components
  ) {
    // populate parents
    const parents: Component[] = [];
    let parent = components.find((c) => c.id === component.parentId);
    while (parent) {
      parents.push(parent);
      parent = components.find((c) => c.id === parent.parentId);
    }

    component.parents = parents.map((p) => p.id);

    // populate children
    component.children = components
      .filter((c) => c.parentId === component.id)
      .map((c) => c.id);
  }
}
