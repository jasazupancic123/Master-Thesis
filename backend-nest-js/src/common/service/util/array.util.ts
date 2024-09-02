export class ArrayUtil {
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }
}