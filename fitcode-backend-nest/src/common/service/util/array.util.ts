export class ArrayUtil {
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  equals<T>(array1: T[], array2: T[]): boolean {
    return (
      array1.length === array2.length &&
      array1.every((value, index) => value === array2[index])
    );
  }

  /**
   *
   * @param array1 - The first array to compare.
   * @param array2 - The second array to compare.
   * @returns An object containing two arrays: `added` and `removed`.
   * `added` contains elements that are in `array1` but not in `array2`, and `removed` contains elements that are in `array2` but not in `array1`.
   *
   * @example
   * ArrayUtil.diff([1, 2, 3], [2, 3, 4]) // returns { added: [1], removed: [4] }
   * ArrayUtil.diff(['a', 'b'], ['b', 'c']) // returns { added: ['a'], removed: ['c'] }
   */
  diff<T>(array1: T[], array2: T[]): { added: T[]; removed: T[] } {
    const added = array1.filter((value) => !array2.includes(value));
    const removed = array2.filter((value) => !array1.includes(value));
    return { added, removed };
  }

  /**
   * Returns all duplicate values in an array.
   *
   * @example
   * ArrayUtil.duplicates(['a', 'b', 'a', 'c', 'b']) // returns ['a', 'b']
   */
  duplicates<T>(array: T[]): T[] {
    const seen = new Set<T>();
    const duplicates = new Set<T>();

    for (const item of array)
      if (seen.has(item)) duplicates.add(item);
      else seen.add(item);

    return Array.from(duplicates);
  }
}
