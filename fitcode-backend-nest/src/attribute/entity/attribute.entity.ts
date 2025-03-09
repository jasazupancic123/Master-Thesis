import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
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

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  options?: Attribute[]; // possible values for select type
}
