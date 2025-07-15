export type FetchOptions = {
  method?: string;
  body?: object;
  query?: Query;
  formData?: FormData;
  cacheTimeInMs?: number; // in seconds
};

export type Query = Record<
  string,
  string | number | string[] | number[] | Date
>;
