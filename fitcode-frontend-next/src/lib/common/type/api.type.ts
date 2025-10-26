export type FetchOptions = {
  method?: string;
  session?: string; // for authentication
  body?: object;
  query?: Query;
  formData?: FormData;
  cacheTimeInMs?: number; // in seconds
  cache?: 'no-store';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next?: any;
};

export type Query = Record<
  string,
  string | boolean | number | string[] | number[] | Date
>;
