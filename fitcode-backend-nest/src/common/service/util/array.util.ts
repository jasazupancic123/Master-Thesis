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

  diff<T>(array1: T[], array2: T[]): { added: T[]; removed: T[] } {
    const added = array1.filter((value) => !array2.includes(value));
    const removed = array2.filter((value) => !array1.includes(value));
    return { added, removed };
  }
}
