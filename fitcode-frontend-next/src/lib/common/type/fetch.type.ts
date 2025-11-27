export type Fetch<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};
