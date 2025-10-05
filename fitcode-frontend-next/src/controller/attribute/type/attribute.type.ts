import type { AttributeType } from '../enum/attribute-value.enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Attribute<T = any> {
  field: keyof T & string; // name of the field in the database
  name: string;
  type?: AttributeType; // defaults to "string"
  required?: boolean;
  unit?: string; // kg, lbs, ...
  defaultValue?: string;
  pattern?: string; // regex pattern for validation
  min?: number; // minimum value for range
  max?: number; // maximum value for range
  options?: Attribute[]; // possible values for select type
  leafesOnly?: boolean; // if true, only leaf nodes can be selected in a single multiselect
  searchBar?: boolean; // if true, show a search bar for select/multiselect
}
