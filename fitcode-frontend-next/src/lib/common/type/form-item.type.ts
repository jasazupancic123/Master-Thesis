import { JSX } from 'react';

export type FormItem = {
  label: string;
  value: any;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customElement?: () => JSX.Element;
  disabled?: boolean;
  optional?: boolean;
};


