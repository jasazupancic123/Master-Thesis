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

import { IsValidDefaultValue } from '@src/common/decorator/is-valid-default-value.decorator';
import { AttributeType } from '@src/common/enum/attribute-type.enum';

export class BaseAttribute<T> {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: keyof T;

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

  @IsValidDefaultValue()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  defaultValue?: string | number | boolean;
}

export class Attribute<T = any> extends BaseAttribute<T> {
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

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  pattern?: string; // regex pattern for validation

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional({ type: () => Attribute, isArray: true })
  @IsOptional()
  @Expose()
  options?: Attribute[]; // possible values for select type
}
