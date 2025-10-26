export type WithUndefined<T> = {
  [K in keyof T]: T[K] | undefined;
};

export type WithNull<T> = {
  [K in keyof T]: T[K] | null;
};

export class ObjectUtil {
  toBoolean<T>(value: T): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string')
      return value.toLowerCase() === 'true' || value === '1';

    return false;
  }

  toNumber<T>(value: T): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0; // Default to 0 for other types
  }

  /**
   * Nests the object to a nested object.
   *
   * @example
   * nestObject({ a: 'b', b: 'c', c: 1 }, 'a') // => { a: { b: { c: 1 }}}
   */
  nest<T extends Record<string, unknown>>(
    obj: T,
    rootKey: keyof T
  ): Record<string, unknown> | null {
    const rootValue = obj[rootKey];
    if (!rootValue) return null; // The root key is not found or has no value

    const result = {} as Record<string, unknown>;

    // Iterate through each key in the object
    for (const key in obj) {
      // Check if the key starts with the rootValue
      if (key !== rootKey && key === rootValue) {
        // found key is the new root key
        const nested = this.nest(obj, key);
        result[key] = nested || obj[key];
      }
    }

    // Return the nested structure if there's anything inside
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Flattens the object to a single level object.
   *
   * @example
   * flattenObject({ a: { b: { c: 1 }}}) // => { a: 'b', b: 'c', c: 1 }
   */
  flatten<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result = {} as Record<string, unknown>;

    const flatten = (currentObj: unknown, parentKey: string) => {
      if (typeof currentObj === 'object' && currentObj !== null) {
        const keys = Object.keys(currentObj);
        if (keys.length === 1) {
          const key = keys[0];
          result[parentKey] = key;
          flatten((currentObj as Record<string, unknown>)[key], key);
        }
      } else {
        result[parentKey] = currentObj;
      }
    };

    Object.keys(obj).forEach((key) => flatten(obj[key], key));
    return result;
  }
}
