import type { AttributeType } from '../enum/attribute-value.enum';

export interface Attribute {
  field: string; // name of the field in the database
  name: string;
  type: AttributeType; // defaults to "string"
  required?: boolean;
  unit?: string; // kg, lbs, ...
  defaultValue?: string;
  min?: number; // minimum value for range
  max?: number; // maximum value for range
  options?: Attribute[]; // possible values for select type
}
