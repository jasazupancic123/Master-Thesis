import { Attribute } from '../../../attribute/entity/attribute.entity';

export class ObjectUtil {
  /**
   * Removes undefined and (optionally) null values from an object. It also
   * recursively cleans nested objects. Note - it excludes Dates.
   */
  clean<T extends object>(obj: T, removeNull = false): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined && (!removeNull || value !== null)) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        )
          acc[key] = this.clean(value, removeNull);
        else acc[key] = value;
      }

      return acc;
    }, {} as Partial<T>);
  }

  /**
   * Recursively check if the value object corresponds to the options.
   *
   * @example
   * ```ts
   * const attribute = {
   *   name: 'Color',
   *   field: 'color',
   *   values: [
   *     { name: 'Red', field: 'red', values: ['dark', 'light'] },
   *     { name: 'Blue', field: 'blue', values: ['ocean', 'navy'] }
   *   ]
   * }
   *
   * isValidValue(attribute, { color: { red: 'dark' } }) // true
   * isValidValue(attribute, { color: { blue: 'dark' } }) // false
   * ```
   */
  isValidValue(
    attribute: Partial<Attribute> & { type: string },
    value: any,
  ): boolean {
    if (attribute.required && (value === null || value === undefined))
      return false;

    switch (attribute.type) {
      case 'string':
        return typeof value === 'string' && value.length > 0;
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return value instanceof Date && !isNaN(value.getTime());
      case 'select':
        if (!attribute.options) return false;

        // single-level select
        if (!attribute.options[0]?.options) {
          return attribute.options.map((v) => v.field).includes(value);
        }

        // multi-level select
        const values = attribute.options;
        return this.validateNestedSelect(values, value[attribute.field]);
      default:
        return true; // if type not defined, allow any value
    }
  }

  private validateNestedSelect(
    options: Attribute[],
    value: Record<string, any>,
  ): boolean {
    if (typeof value !== 'object' || value === null) return false;

    for (const key in value) {
      const selectedOption = options.find((opt) => opt.field === key);
      if (!selectedOption) return false;

      const selectedValue = value[key];
      if (typeof selectedValue === 'object') {
        if (!selectedOption.options || !Array.isArray(selectedOption.options))
          return false;

        return this.validateNestedSelect(selectedOption.options, selectedValue);
      }

      // leaf, validate against available values
      if (
        !selectedOption.options ||
        !selectedOption.options.map((v) => v.field).includes(selectedValue)
      )
        return false;
    }

    return true;
  }
}
