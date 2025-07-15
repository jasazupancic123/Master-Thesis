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
import { AttributeType } from '../../common/enum/attribute-type.enum';

export class Attribute {
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
  @ApiProperty()
  @Expose()
  type: AttributeType; // defaults to "string"

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
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  options?: Attribute[]; // possible values for select type
}
