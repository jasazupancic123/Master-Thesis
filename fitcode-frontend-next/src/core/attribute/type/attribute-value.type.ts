// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AttributeValue<T = Record<string, any>> = {
  field: keyof T;
  value: string | number;
  selected?: string;
};
