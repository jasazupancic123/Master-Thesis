export type Validate<Response = any> = {
  error: boolean;
  message?: string;
  data?: Response;
}