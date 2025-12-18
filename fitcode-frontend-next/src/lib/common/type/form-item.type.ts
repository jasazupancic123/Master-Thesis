import type { JSX } from 'react';

export type FormItem = {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customElement?: () => JSX.Element;
  disabled?: boolean;
  optional?: boolean;
};
