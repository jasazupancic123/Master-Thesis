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
      if (
        value !== undefined &&
        (!removeNull || value !== null) &&
        !(value instanceof Date)
      ) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
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
    if (attribute.type === 'string')
      return typeof value === 'string' && value.length > 0;

    if (attribute.type === 'number') return typeof value === 'number';

    if (attribute.type === 'boolean') return Boolean(value);

    if (attribute.type === 'date') return value instanceof Date;

    if (
      attribute.type === 'select' &&
      attribute.values &&
      typeof attribute.values[0] === 'string'
    )
      // single-level select
      return attribute.values.includes(value);

    if (attribute.values) {
      // TODO multi-level select
      return true;
    }

    return false;
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

  private checkSelectOptions(
    options: (string | ExerciseAttributeSelectOption)[],
    value: any,
  ): boolean {
    for (const option of options) {
      if (typeof option === 'string' && option === value) return true;

      const { field, values } = option as ExerciseAttributeSelectOption;
      const nestedValue = value[field];

      if (nestedValue && values.length > 0) {
        if (typeof values[0] === 'string') return values.includes(nestedValue); // single-level select of strings
        return this.checkSelectOptions(values, nestedValue); // multi-level select
      }
    }
  }
}
