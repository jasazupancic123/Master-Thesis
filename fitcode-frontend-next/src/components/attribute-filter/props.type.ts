/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Attribute } from '@/controller/attribute/type/attribute.type';

export interface AttributeFilterProps {
  attribute: Attribute;
  value: any;
  onChange: (value: any) => void;
}
