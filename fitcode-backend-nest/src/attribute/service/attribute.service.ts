import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { Create } from '@src/common/type/entity.type';
import { ValidateError } from '@src/common/type/validate.type';

import { CACHE_KEY_ATTRIBUTES } from '../constant/cache.constant';
import { Attribute } from '../entity/attribute.entity';
import { AttributeValue } from '../entity/attribute-value.entity';
import { AttributeRepository } from '../repository/attribute.repository';

@Injectable()
export class AttributeService {
  private logger = new Logger(AttributeService.name);

  constructor(
    private readonly repository: AttributeRepository,
    private readonly cacheManagerService: CacheManagerService,
  ) {}

  async create(data: Create<Attribute>): Promise<Attribute> {
    this.logger.debug(`Creating attribute with data ${JSON.stringify(data)}`);
    await this.repository.save(data);
    await this.cacheManagerService.del(CACHE_KEY_ATTRIBUTES);
    return data;
  }

  async findOneBySlug(slug: string): Promise<Attribute> {
    return await this.repository.findById(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Attribute> {
    const item = await this.repository.findById(slug);
    if (!item) throw new BadRequestException('Attribute not found');
    return item;
  }

  async findAll(): Promise<Attribute[]> {
    const cached =
      await this.cacheManagerService.get<Attribute[]>(CACHE_KEY_ATTRIBUTES);

    return cached ? cached : await this.repository.findAll();
  }

  parseSelectedValueFromString(
    s: string,
  ): Pick<AttributeValue, 'selected' | 'value'> {
    // value is last part, all before is select
    const parts = s.split(':');
    return {
      selected: parts.slice(0, parts.length - 1).join(':'),
      value: parts[parts.length - 1],
    };
  }

  uniqueAttributeValues(values: AttributeValue[]): AttributeValue[] {
    const uniqueMap = new Map<string, AttributeValue>();
    for (const val of values) {
      const key = `${val.field}:${val.selected}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, val);
    }

    return Array.from(uniqueMap.values());
  }

  validate(
    values: AttributeValue[],
    attributes: Attribute[],
    onError?: (error: ValidateError) => void,
  ): AttributeValue[] {
    const vals: AttributeValue[] = [];

    for (const attribute of attributes) {
      const attributeValues = values.filter(
        (val) => val.field === attribute.field,
      );

      if (
        attribute.required &&
        (attributeValues[0]?.value === null ||
          attributeValues[0]?.value === undefined)
      ) {
        const message = `Attribute "${attribute.name}" is required`;
        if (onError) {
          onError({ field: attribute.field, message });
          return [];
        } else throw new BadRequestException(message);
      }

      if (
        attribute.type !== AttributeType.Multiselect &&
        attributeValues.length > 1
      ) {
        const message = `Attribute "${attribute.name}" cannot have multiple values`;
        if (onError) {
          onError({ field: attribute.field, message });
          return [];
        } else throw new BadRequestException(message);
      }

      for (const v of attributeValues) {
        if (attribute.required && (v.value === null || v.value === undefined))
          throw new BadRequestException(
            `Attribute "${attribute.name}" is required`,
          );

        let message = '';
        switch (attribute.type) {
          case AttributeType.String:
            if (typeof v.value !== 'string')
              message = `Value for attribute "${attribute.name}" must be a string`;
            break;
          case AttributeType.Number:
            if (isNaN(+v.value))
              message = `Value for attribute "${attribute.name}" must be a number`;
            break;
          case AttributeType.Boolean:
            if (v.value !== 'true' && v.value !== 'false')
              message = `Value for attribute "${attribute.name}" must be a boolean`;
            break;
          case AttributeType.Select:
          case AttributeType.Multiselect:
            if (!attribute.options || attribute.options.length === 0) {
              message = `Attribute "${attribute.name}" has no valid options`;
              break;
            }

            const matchedAttribute = this.validateSelection(
              v.selected,
              attribute.options,
            ); // returns leaf attribute of options, so its not select or multiselect type anymore and we can recurse this validate function to check it again

            if (!matchedAttribute) {
              const options = attribute.options
                .map((opt) => opt.field)
                .join(', ');

              message = `Value "${v.selected}" for attribute "${attribute.name}" is not a valid option. Valid options are: ${options}`;
              break;
            }

            // validate leafs for custom types
            switch (matchedAttribute.type) {
              case AttributeType.Number:
                if (isNaN(+v.value))
                  message = `Value for attribute "${attribute.name}" must be a number`;
                break;
              case AttributeType.Boolean:
                if (v.value !== 'true' && v.value !== 'false')
                  message = `Value for attribute "${attribute.name}" must be a boolean`;
                break;
            }

            break;
          default:
            break;
        }

        if (message) {
          if (onError) {
            onError({ field: attribute.field, message });
            return [];
          } else throw new BadRequestException(message);
        }

        vals.push(v);
      }
    }

    return vals;
  }

  /**
   * Populates param values data. If no param values are provided, it
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
   * const values = getParamValues(params, paramValues)
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
  getParamValues(params: Attribute[], paramValues?: AttributeValue[]) {
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

    return this.validate(values, params);
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
  populateDefaultSelectedValue(param: Attribute): {
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

  private validateSelection(
    selectedPath: string,
    options: Attribute[],
  ): Attribute | null {
    const pathParts = selectedPath.split(':');
    let currentOptions = options;

    let found: Attribute;
    for (const part of pathParts) {
      found = currentOptions.find((opt) => opt.field === part);

      if (!found) return null;
      if (found.options) currentOptions = found.options || [];
      else break;
    }

    return found;
  }
}
