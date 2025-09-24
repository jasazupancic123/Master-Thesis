import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { AttributeType } from '@src/common/enum/attribute-type.enum';

export type PrimitiveType = string | number | boolean | null;

export class BaseAttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  field: string;

  @IsEnum(() => AttributeType)
  @ApiProperty({ enum: AttributeType })
  @Expose()
  type: AttributeType; // must match the attribute type

  @IsString()
  @ApiProperty()
  @Expose()
  value: any; // can be string, number, boolean, object (for complex types like range, coordinates, etc.)
}

export class ValueAttributeValue extends BaseAttributeValue {
  type: AttributeType.Value;

  @ApiProperty()
  @Expose()
  value: PrimitiveType; // for type value, this is the actual value
}

export class StringAttributeValue extends BaseAttributeValue {
  type: AttributeType.String;

  @ApiProperty()
  @Expose()
  value: string; // for type string, this is the actual string
}

export class BooleanAttributeValue extends BaseAttributeValue {
  type: AttributeType.Boolean;

  @ApiProperty()
  @Expose()
  value: boolean; // for type boolean, this is the actual boolean value
}

export class NumberAttributeValue extends BaseAttributeValue {
  type: AttributeType.Number;

  @ApiProperty()
  @Expose()
  value: number; // for type number, this is the actual number value
}

export class SelectAttributeValue extends BaseAttributeValue {
  type: AttributeType.Select;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string; // for type select, this denotes the selected option id

  @IsString()
  @ApiProperty()
  @Expose()
  selected: string; // if type is select, this denotes the selected value, but its type can be number, which is saved in value above
}

export class MultiSelectAttributeValue extends BaseAttributeValue {
  type: AttributeType.Multiselect;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string;

  @IsString()
  @ApiProperty()
  @Expose()
  selected: string;
}

export class AttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  field: string;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string;

  @IsString()
  @ApiProperty()
  @Expose()
  selected: string; // if type is select, this denotes the selected value, but its type can be number, which is saved in value above
}
