export type Validate<Response = unknown> = {
  error: boolean;
  message?: string;
  data?: Response;
};

export type ValidateError<T = unknown> = {
  field: keyof T;
  message: string;
};

export type ValidateRowError<T = Record<string, unknown>> = {
  row: number;
  errors: ValidateError<T>[];
};

export type ValidateRows<T = Record<string, unknown>> = ValidateRowError<T>[];
