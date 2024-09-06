import { ExerciseAttribute, ExerciseAttributeSelectOption } from '../../../exercise/entity/exercise-attribute.entity';

export class ObjectUtil {
  /**
   * Removes undefined and (optionally) null values from an object. It also
   * recursively cleans nested objects.
   */
  clean<T extends object>(obj: T, removeNull = false): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined && (!removeNull || value !== null)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value))
          acc[key] = this.clean(value, removeNull);
        else
          acc[key] = value;
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

    if (attribute.type === 'number')
      return typeof value === 'number';

    if (attribute.type === 'boolean')
      return Boolean(value);

    if (attribute.type === 'date')
      return value instanceof Date;

    if (attribute.type === 'select' && attribute.values && typeof attribute.values[0] === 'string')
      // single-level select
      return attribute.values.includes(value);

    if (attribute.values) {
      // TODO multi-level select
      return true;
    }

    return false;
  }

  private checkSelectOptions(options: (string | ExerciseAttributeSelectOption)[], value: any): boolean {
    for (const option of options) {
      if (typeof option === 'string' && option === value)
        return true;

      const { field, values } = option as ExerciseAttributeSelectOption;
      const nestedValue = value[field];

      if (nestedValue && values.length > 0) {
        if (typeof values[0] === 'string') return values.includes(nestedValue); // single-level select of strings
        return this.checkSelectOptions(values, nestedValue); // multi-level select
      }
    }
  }
}
