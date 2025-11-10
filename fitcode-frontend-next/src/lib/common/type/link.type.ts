import type { ReactNode } from 'react';

export type ILink = {
  id: string;
  href: string;
  label: string;
  icon?: ReactNode;
  selectedIcon?: ReactNode;
};
