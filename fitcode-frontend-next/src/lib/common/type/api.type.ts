export type FetchOptions = {
  method?: string;
  session?: string; // for authentication
  body?: object;
  query?: Query;
  formData?: FormData;
  cacheTimeInMs?: number; // in seconds
  cache?: 'no-store';
  next?: any;
};

export type Query = Record<
  string,
  string | boolean | number | string[] | number[] | Date
>;
