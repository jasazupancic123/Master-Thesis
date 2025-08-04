// DeepPick core — only proceed if T is an object
type DeepPickUtil<T extends Record<string, any>, Path extends string> =
  // Does Path contain a dot? Split into Key and Rest
  Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? // If T[Key] is an array, pick DeepPick from its element type (U), else directly from T[Key]
        T[Key] extends Array<infer U>
        ? { [K in Key]: DeepPickUtil<U, Rest>[] }
        : { [K in Key]: DeepPickUtil<T[Key], Rest> }
      : never
    : // No dot in Path - must be a key of T
      Path extends keyof T
      ? Pick<T, Path>
      : never;

// MergeUnion to flatten intersection of picked objects
type MergeUnion<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? { [K in keyof I]: I[K] }
  : never;

// Accept union of string paths — no accumulation via union to keep intellisense cleaner
export type DeepPick<T, Paths extends string> = MergeUnion<
  Paths extends any ? DeepPickUtil<T, Paths> : never
>;
