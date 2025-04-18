import { AttributeType } from '../enum/attribute-value.enum';

export interface Attribute {
  field: string; // name of the field in the database
  name: string;
  type: AttributeType; // defaults to "string"
  required?: boolean;
  unit?: string; // kg, lbs, ...
  defaultValue?: string;
  options?: Attribute[]; // possible values for select type
}
