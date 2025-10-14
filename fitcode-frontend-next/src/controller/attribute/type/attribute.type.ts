import type { AttributeType } from '../enum/attribute-value.enum';

export interface BaseAttribute<T> {
  field: keyof T; // name of the field in the database
  name: string;
  type?: AttributeType; // defaults to "string"
  description?: string;
  unit?: string; // kg, lbs, ...
  required?: boolean;
  defaultValue?: string | number | boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Attribute<T = any> extends BaseAttribute<T> {
  min?: number; // minimum value for range
  max?: number; // maximum value for range
  pattern?: string; // regex pattern for validation
  options?: Attribute[]; // possible values for select type

  // frontend specific
  leafesOnly?: boolean; // if true, only leaf nodes can be selected in a single multiselect
  searchBar?: boolean; // if true, show a search bar for select/multiselect
}
