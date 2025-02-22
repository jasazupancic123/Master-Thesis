import {
  ExerciseAttribute,
  ExerciseAttributeSelectOption,
} from '../../../exercise/entity/exercise-attribute.entity';

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
  isValidValue(attribute: Partial<ExerciseAttribute>, value: any): boolean {
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
        if (!attribute.values) return false;

        // single-level select
        if (typeof attribute.values[0] === 'string') {
          console.log('single level', attribute.values, value);
          return (attribute.values as string[]).includes(value);
        }

        // multi-level select
        const values = attribute.values as ExerciseAttributeSelectOption[];
        return this.validateNestedSelect(values, value[attribute.field]);
      default:
        return true; // if type not defined, allow any value
    }
  }

  /**
   * Removes key prefix from each object key. For example:
   *
   * ```ts
   * const obj = { 'john.first': 'John', 'john.last': 'Doe', 'john.age': 40 }
   * const newObj = removeKeyPrefix(obj, 'john')
   * // => { first: 'John', last: 'Doe', age: 40 }
   * ```
   */
  removeKeyPrefix<T>(
    obj: { [key: string]: T },
    prefix: string,
  ): { [key: string]: T } {
    const prefixRegex = new RegExp(`^${prefix}\\.`);

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(prefixRegex, ''),
        value,
      ]),
    );
  }

  /**
   * Adds key prefix for each object key. For example:
   *
   * ```ts
   * const obj = { first: 'John', last: 'Doe', age: 40 }
   * const newObj = addKeyPrefix(obj, 'john')
   * // => { 'john.first': 'John', 'john.last': 'Doe', 'john.age': 40 }
   * ```
   */
  addKeyPrefix<T>(
    obj: { [key: string]: T },
    prefix: string,
  ): { [key: string]: T } {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [`${prefix}.${key}`, value]),
    );
  }

  private validateNestedSelect(
    options: ExerciseAttributeSelectOption[],
    value: Record<string, any>,
  ): boolean {
    if (typeof value !== 'object' || value === null) return false;

    for (const key in value) {
      const selectedOption = options.find((opt) => opt.field === key);
      if (!selectedOption) return false;

      const selectedValue = value[key];
      if (typeof selectedValue === 'object') {
        if (!selectedOption.values || !Array.isArray(selectedOption.values))
          return false;

        return this.validateNestedSelect(
          selectedOption.values as ExerciseAttributeSelectOption[],
          selectedValue,
        );
      }

      // leaf, validate against available values
      if (
        !selectedOption.values ||
        !(selectedOption.values as string[]).includes(selectedValue)
      )
        return false;
    }

    return true;
  }
}
