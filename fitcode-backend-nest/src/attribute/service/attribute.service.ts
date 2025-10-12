import { BadRequestException, Injectable } from '@nestjs/common';

import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { CommonService } from '@src/common/service/common.service';
import { ValidateError } from '@src/common/type/validate.type';

import { Attribute } from '../entity/attribute.entity';
import { AttributeValue } from '../entity/attribute-value.entity';

@Injectable()
export class AttributeService {
  constructor(private readonly common: CommonService) {}

  /**
   * @example
   * ```ts
   * const parsed = parseSelectedValue('my:selected:value');
   * // => {
   * //   selected: 'my:selected',
   * //   value: 'value'
   * // }
   * ```
   */
  parseSelectedValue(s: string): Pick<AttributeValue, 'selected' | 'value'> {
    // value is last part, all before is select
    const parts = s.split(':');
    return {
      selected: parts.slice(0, parts.length - 1).join(':'),
      value: parts[parts.length - 1],
    };
  }

  uniqueValues<T>(values: AttributeValue<T>[]): AttributeValue<T>[] {
    const uniqueMap = new Map<string, AttributeValue<T>>();
    for (const val of values) {
      const key = `${val.field.toString()}:${val.selected}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, val);
    }

    return Array.from(uniqueMap.values());
  }

  validate<T>(
    values: AttributeValue<T>[],
    attributes: Attribute<T>[],
    onError?: (error: ValidateError<T>) => void,
  ): AttributeValue<T>[] {
    const vals: AttributeValue<T>[] = [];

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
        if (attribute.required && (v.value === null || v.value === undefined)) {
          const message = `Attribute "${attribute.name}" is required`;
          if (onError) {
            onError({ field: attribute.field, message });
            return [];
          } else throw new BadRequestException(message);
        }

        let message = '';
        switch (attribute.type) {
          case AttributeType.String:
            if (typeof v.value !== 'string')
              message = `Value for attribute "${attribute.name}" must be a string`;

            if (
              !this.common.object.isEmpty(attribute.pattern) &&
              !new RegExp(attribute.pattern!).test(v.value as string)
            )
              message = `Value for attribute "${attribute.name}" does not match required pattern`;

            break;
          case AttributeType.Number:
            if (isNaN(+v.value))
              message = `Value for attribute "${attribute.name}" must be a number`;

            if (
              !this.common.object.isEmpty(attribute.min) &&
              +v.value < attribute.min!
            )
              message = `Value for attribute "${attribute.name}" must be min ${attribute.min}`;

            if (
              !this.common.object.isEmpty(attribute.max) &&
              +v.value > attribute.max!
            )
              message = `Value for attribute "${attribute.name}" must be max ${attribute.max}`;

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

            if (!v.selected) {
              // single-level select
              const valueAttribute = attribute.options.find(
                (opt) => opt.field === v.value,
              );

              if (!valueAttribute) {
                const options = attribute.options
                  .map((opt) => opt.field)
                  .join(', ');

                message = `Value "${v.value}" for attribute "${attribute.name}" is not a valid option. Valid options are: ${options}`;
                break;
              }

              if (valueAttribute.options && valueAttribute.options.length > 0) {
                const options = valueAttribute.options
                  .map((opt) => opt.field)
                  .join(', ');

                message = `Option "${v.value}" has nested options, please select one of the following: ${options}`;
                break;
              }
            } else {
              // multi-level select
              const matchedAttribute = this.validateSelection(
                v.selected,
                attribute.options,
              ); // returns leaf attribute of options, so its not select or multiselect type anymore and we can recurse this validate function to check it again

              if (!matchedAttribute) {
                const options = attribute.options
                  .map((opt) => opt.field)
                  .join(', ');

                message = `Value "${v.value}" for attribute "${attribute.name}" is not a valid option. Valid options are: ${options}`;
                break;
              }

              // check if provided value is leaf
              const valueAttribute = matchedAttribute.options?.find(
                (opt) => opt.field === v.value,
              );

              if (!valueAttribute && matchedAttribute.options?.length > 0) {
                const options = matchedAttribute.options
                  .map((opt) => opt.field)
                  .join(', ');

                message = `Value "${v.value}" for attribute "${attribute.name}" is not a valid option. Valid options are: ${options}`;
                break;
              }

              if (valueAttribute?.options?.length > 0) {
                const options = valueAttribute.options
                  .map((opt) => opt.field)
                  .join(', ');

                message = `Option "${v.value}" has nested options, please select one of the following: ${options}`;
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

    return found; // NOTE - can be internal node, not leaf
  }
}
