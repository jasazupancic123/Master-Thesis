import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Attribute } from './attribute.entity';
import { AttributeType } from '../../common/enum/attribute-type.enum';

export class AttributeRange extends PickType(Attribute, [
  'field',
  'required',
  'unit',
  'defaultValue',
]) {
  @IsEnum(AttributeType)
  @IsString()
  @IsOptional()
  @ApiProperty()
  @Expose()
  type?: AttributeType; // defaults to "string"

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  name?: string;

  @ValidateNested({ each: true })
  @Type(() => AttributeRange)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  options?: AttributeRange[]; // possible values for select type

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
