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
}