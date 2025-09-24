import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { AttributeType } from '@src/common/enum/attribute-type.enum';

export class BaseAttribute {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: string; // name of the field in the database

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsEnum(AttributeType)
  @IsString()
  @ApiProperty({ enum: AttributeType, enumName: 'AttributeType' })
  @Expose()
  type?: AttributeType; // defaults to "value"

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  required?: boolean;

  @IsString()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  unit?: string; // kg, lbs, ...

  @IsString()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  defaultValue?: string;
}

export class ValueAttribute extends BaseAttribute {
  type: AttributeType.Value;
}

export class StringAttribute extends BaseAttribute {
  type: AttributeType.String;

  @IsString()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  pattern?: string; // regex pattern for validation
}

export class BooleanAttribute extends BaseAttribute {
  type: AttributeType.Boolean;
}

export class NumberAttribute extends BaseAttribute {
  type: AttributeType.Number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  @Expose()
  min?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  @Expose()
  max?: number;
}

export class SelectAttribute extends BaseAttribute {
  type: AttributeType.Select;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional({ type: () => Attribute, isArray: true })
  @IsNotEmpty()
  @Expose()
  options: Attribute[]; // possible values for select type
}

export class MultiselectAttribute extends BaseAttribute {
  type: AttributeType.Multiselect;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional({ type: () => Attribute, isArray: true })
  @IsNotEmpty()
  @Expose()
  options: Attribute[]; // possible values for select type
}

export class Attribute extends BaseAttribute {
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  @Expose()
  min?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  @Expose()
  max?: number;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional({ type: () => Attribute, isArray: true })
  @IsOptional()
  @Expose()
  options?: Attribute[]; // possible values for select type
}
