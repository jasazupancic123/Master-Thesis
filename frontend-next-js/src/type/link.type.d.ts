import { ReactNode } from 'react';

export interface ILink {
  id: string;
  href: string;
  label: string;
  icon?: ReactNode;
}