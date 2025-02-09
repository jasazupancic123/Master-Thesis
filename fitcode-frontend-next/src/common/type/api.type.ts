export type FetchOptions = {
  method?: string;
  token?: string;
  body?: object;
  query?: Query;
  formData?: FormData;
};

export type Query = Record<
  string,
  string | number | string[] | number[] | Date
>;
