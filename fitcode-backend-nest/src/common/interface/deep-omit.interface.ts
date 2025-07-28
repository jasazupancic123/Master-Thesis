// Core utility to omit a nested path from an object
type DeepOmitUtil<
  T extends Record<string, any>,
  Path extends string,
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? T[Key] extends Array<infer U>
      ? {
          [K in keyof T]: K extends Key ? DeepOmitUtil<U, Rest>[] : T[K];
        }
      : {
          [K in keyof T]: K extends Key ? DeepOmitUtil<T[Key], Rest> : T[K];
        }
    : T
  : Path extends keyof T
    ? Omit<T, Path>
    : T;

// Merge utility (same as in your DeepPick)
type MergeUnion<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? { [K in keyof I]: I[K] }
  : never;

// Public type to omit multiple deep paths from T
export type DeepOmit<T, Paths extends string> = MergeUnion<
  Paths extends any ? DeepOmitUtil<T, Paths> : never
>;
