export class ObjectUtil {
  /**
   * Nests the object to a nested object.
   *
   * @example
   * nestObject({ a: 'b', b: 'c', c: 1 }, 'a') // => { a: { b: { c: 1 }}}
   */
  static nestObject<T extends Record<string, any>>(obj: T, rootKey: keyof T): Record<string, any> | null {
    const rootValue = obj[rootKey];
    if (!rootValue)
      return null; // The root key is not found or has no value

    const result = {} as Record<string, any>;

    // Iterate through each key in the object
    for (const key in obj) {
      // Check if the key starts with the rootValue
      if (key !== rootKey && key === rootValue) {
        // found key is the new root key
        const nested = this.nestObject(obj, key);
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
  static flattenObject<T extends Record<string, any>>(obj: T): Record<string, any> {
    const result = {} as Record<string, any>;

    const flatten = (currentObj: any, parentKey: string) => {
      if (typeof currentObj === 'object' && currentObj !== null) {
        const keys = Object.keys(currentObj);
        if (keys.length === 1) {
          const key = keys[0];
          result[parentKey] = key;
          flatten(currentObj[key], key);
        }
      } else {
        result[parentKey] = currentObj;
      }
    };

    Object.keys(obj).forEach(key => flatten(obj[key], key));
    return result;
  }
}