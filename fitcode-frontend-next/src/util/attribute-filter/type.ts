/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Attribute } from '@/core/attribute/type/attribute.type';

export interface AttributeFilterProps {
  attribute: Attribute;
  value: any;
  onChange: (value: any) => void;
  search?: string;
}

export interface AttributeDropdownProps {
  attributes: Attribute[];
  label: string;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}
