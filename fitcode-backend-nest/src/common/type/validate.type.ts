export type Validate<Response = unknown> = {
  error: boolean;
  message?: string;
  data?: Response;
};
