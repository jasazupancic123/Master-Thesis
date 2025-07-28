export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? DeepPartial<U>[]
    : T extends Date
      ? never
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;
