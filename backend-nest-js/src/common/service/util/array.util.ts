export class ArrayUtil {
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  equals<T>(array1: T[], array2: T[]): boolean {
    return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
  }
}