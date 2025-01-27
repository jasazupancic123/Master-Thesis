export type FetchOptions = {
  method?: string;
  token?: string;
  body?: object;
  query?: Record<string, string | number>;
  formData?: FormData;
}