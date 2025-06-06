import { AttributeType } from '../enum/attribute-value.enum';

export interface AttributeRange {
  field: string; // name of the field in the database
  name: string;
  type: AttributeType; // defaults to "string"
  required?: boolean;
  unit?: string; // kg, lbs, ...
  defaultValue?: string;
  options?: AttributeRange[]; // possible values for select type
  min?: number; // minimum value for range
  max?: number; // maximum value for range
}
