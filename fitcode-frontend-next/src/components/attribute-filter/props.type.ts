import type { Attribute } from '@/controller/attribute/type/attribute.type';

export interface AttributeFilterProps {
  attribute: Attribute;
  value: any;
  onChange: (value: any) => void;
  search?: string;
}
