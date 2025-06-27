import { AttributeType } from '../enum/attribute-value.enum';
import { Attribute } from './attribute.type';

export interface AttributeRange extends Attribute {
  type: AttributeType; // defaults to "string"
  name: string;
  options?: AttributeRange[]; // possible values for select type
  min?: number; // minimum value for range
  max?: number; // maximum value for range
}
